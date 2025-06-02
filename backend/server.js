// server.js - Main Express application
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const s3Client = require('./config/s3');
const app = express();
const PORT = process.env.PORT || 5001;

// Check for AWS environment variables
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
  console.log('AWS credentials detected in environment variables');
  console.log(`AWS Region: ${process.env.AWS_REGION}`);
  console.log(`AWS Bucket: ${process.env.AWS_BUCKET_NAME || 'literexia-bucket'}`);
} else {
  console.warn('⚠️ AWS credentials not found in environment variables - S3 uploads will use database fallback');
}

// Define userSchema at the module level so it's available throughout the file
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  roles: {
    type: String,
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Request logger middleware
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

// Apply middlewares
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://192.168.56.1:5173',
      'http://192.168.1.4:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-requested-with', 'X-Requested-With']
}));

// Add pre-flight handling for all routes
app.options('*', cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://192.168.56.1:5173',
      'http://192.168.1.4:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-requested-with', 'X-Requested-With']
}));

// Increase body parser limits for larger file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Test route to verify server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Define database connection with better error handling
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // FIRST connect to the database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017', {
      dbName: 'test',
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000
    });

    console.log('✅ MongoDB Connected to test database');
    console.log('MongoDB Connected:', mongoose.connection.host);
    
    // Test database connections
    const testDb = mongoose.connection.useDb('test');
    const teachersDb = mongoose.connection.useDb('teachers');
    const parentDb = mongoose.connection.useDb('parent');
    
    // Connect to Pre_Assessment database
    const preAssessmentDb = mongoose.connection.useDb('Pre_Assessment');
    console.log('✅ Connected to Pre_Assessment database');

    // List collections in Pre_Assessment database
    try {
      const preAssessmentCollections = await preAssessmentDb.db.listCollections().toArray();
      console.log('Available collections in Pre_Assessment:');
      preAssessmentCollections.forEach(c => console.log(`- ${c.name}`));
    } catch (err) {
      console.warn('⚠️ Could not list Pre_Assessment collections:', err.message);
    }

    const collections = {
      test: [],
      teachers: [],
      parent: []
    };

    try {
      // Get collections for each database
      const [testCols, teacherCols, parentCols] = await Promise.all([
        testDb.db.listCollections().toArray(),
        teachersDb.db.listCollections().toArray(),
        parentDb.db.listCollections().toArray()
      ]);
      
      collections.test = testCols;
      collections.teachers = teacherCols;
      collections.parent = parentCols;
    } catch (error) {
      console.error('Error listing collections:', error);
    }

    console.log('\nVerifying database structure:');
    console.log('test database collections:', collections.test.map(c => c.name));
    console.log('teachers database collections:', collections.teachers.map(c => c.name));
    console.log('parent database collections:', collections.parent.map(c => c.name));

    // Display collections in test database
    const testCollections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections in test:');
    testCollections.forEach(c => console.log(`- ${c.name}`));

    // Test collection counts
    const counts = {
      students: 0,
      teachers: 0,
      parents: 0
    };

    try {
      [counts.students, counts.teachers, counts.parents] = await Promise.all([
        testDb.collection('users').countDocuments(),
        teachersDb.collection('profile').countDocuments(),
        parentDb.collection('parent_profile').countDocuments()
      ]);
    } catch (error) {
      console.error('Error counting documents:', error);
    }

    console.log('\nInitial collection counts:');
    console.log('- Students (test/users):', counts.students);
    console.log('- Teachers (teachers/profile):', counts.teachers);
    console.log('- Parents (parent/parent_profile):', counts.parents);
    console.log('Total users:', counts.students + counts.teachers + counts.parents);

    // Initialize available databases info
    try {
      const db = mongoose.connection.db;
      const adminDb = db.admin();
      const dbInfo = await adminDb.listDatabases();

      console.log('Available databases:');
      dbInfo.databases.forEach(db => console.log(`- ${db.name}`));

      // Ensure parent database exists by accessing it directly
      console.log('Created connection to parent database');

      // Ensure users_web database exists by accessing it directly
      const usersWebDb = mongoose.connection.useDb('users_web');
      console.log('Created connection to users_web database');
    } catch (err) {
      console.warn('⚠️ Could not list available databases:', err.message);
    }

    // NOW initialize the ManageProgress module
    try {
      const progressController = require('./controllers/Teachers/ManageProgress/progressController');
      await progressController.initializeCollections();
      console.log('✅ Initialized progress collections');
    } catch (error) {
      console.warn('⚠️ Could not initialize progress collections:', error.message);
    }

    // Run automatic migration of category results
    try {
      const CategoryResultsService = require('./services/Teachers/CategoryResultsService');
      await CategoryResultsService.migrateStudentIds();
      console.log('✅ Completed automatic migration of category results');
    } catch (error) {
      console.warn('⚠️ Could not run category results migration:', error.message);
    }

    console.log('\n✅ Database setup complete');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    console.log('Authenticated user:', req.user.email, 'User roles:', req.user.roles);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Handle roles which might be a string or array from the token
    let userRoles = req.user.roles;
    if (typeof userRoles === 'string') {
      userRoles = [userRoles]; // Convert string to array for consistency
    } else if (!Array.isArray(userRoles)) {
      userRoles = []; // Default to empty array if undefined
    }

    // Add support for Tagalog role names
    const roleMap = {
      'guro': 'teacher',
      'magulang': 'parent'
    };

    // Convert any Tagalog roles to English equivalents
    userRoles = userRoles.map(role => roleMap[role] || role);

    // Check if user has at least one of the allowed roles
    const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasAllowedRole) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
    }

    next();
  };
};

// Connect to MongoDB first - then register routes after connection is established
connectDB().then(async (connected) => {
  if (!connected) {
    console.error('Failed to connect to database. Server not started.');
    process.exit(1);
  }

  // Create User model after connection is established
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  console.log('Database connected successfully - registering routes');
  console.log('User model is targeting collection:', User.collection.name);

  // Test S3 connection
  if (s3Client.testS3Connection) {
    s3Client.testS3Connection()
      .then(success => {
        if (success) {
          console.log('S3 bucket configuration is working correctly');
        } else {
          console.warn('S3 bucket connection failed - image uploads may not work');
        }
      })
      .catch(err => console.error('Error testing S3 connection:', err));
  }

  // Register routes
  try {
    // Register auth routes first
    const authRouter = require('./routes/auth/authRoutes');
    app.use('/api/auth', authRouter);
    console.log('✅ Auth routes registered at /api/auth/*');

    // Register admin routes
    const teacherRoutes = require('./routes/Admin/teacherRoutes');
    app.use('/api/admin/manage', teacherRoutes);
    console.log('✅ Teacher and student routes registered at /api/admin/manage/*');

    // Register admin parent routes
    const parentAdminRoutes = require('./routes/Admin/parentRoutes');
    app.use('/api/admin/manage', parentAdminRoutes);
    console.log('✅ Parent admin routes registered at /api/admin/manage/*');

    // Register email routes
    const emailRoutes = require('./routes/emailRoutes');
    app.use('/api/admin', emailRoutes);
    console.log('✅ Email routes registered at /api/admin/send-credentials');

    // Debug middleware for /api/parents
    app.use('/api/parents', (req, res, next) => {
      console.log('[SERVER] /api/parents route hit:', req.method, req.originalUrl);
      next();
    });

    // Register parent routes
    const parentRoutes = require('./routes/Parents/parentProfile');
    app.use('/api/parents', parentRoutes);
    console.log('✅ Parent routes registered at /api/parents/*');

    // Register childPdfRoutes
    const childPdfRoutes = require('./routes/Parents/childPdfRoutes');
    app.use('/api/parent', childPdfRoutes);
    console.log('✅ Child PDF routes registered at /api/parent/child_pdf');

    // Register admin profile routes
    const adminProfileRoutes = require('./routes/Admin/adminProfile');
    const adminDashboardRoutes = require('./routes/Admin/adminDashboard');
    app.use('/api/admin', adminProfileRoutes);
    app.use('/api/admin', adminDashboardRoutes);
    console.log('✅ Admin routes registered at /api/admin/*');

    // Register roles routes
    try {
      app.use('/api/roles', require('./routes/rolesRoutes'));
      console.log('✅ Loaded roles routes');
    } catch (error) {
      console.warn('⚠️ Could not load roles routes:', error.message);
    }

    // Try to load teacher profile routes
    try {
      app.use('/api/teachers', require('./routes/Teachers/teacherProfile'));
      console.log('✅ Loaded teacher profile routes');
    } catch (error) {
      console.warn('⚠️ Could not load teacher profile routes:', error.message);
    }

    // Initialize prescriptive analyses for all students
    try {
      const PrescriptiveAnalysisService = require('./services/Teachers/PrescriptiveAnalysisService');
      (async () => {
        try {
          await PrescriptiveAnalysisService.initializeForAllStudents();
          console.log('✅ Initialized prescriptive analyses for all students');
          
          // Also update all categoryResultIds to ensure proper linking
          console.log('Updating categoryResultIds for all analyses...');
          await PrescriptiveAnalysisService.updateAllCategoryResultIds();
          console.log('✅ Updated all categoryResultIds');
        } catch (initError) {
          console.warn('⚠️ Could not initialize prescriptive analyses:', initError.message);
        }
      })();
    } catch (error) {
      console.warn('⚠️ Could not initialize prescriptive analyses:', error.message);
    }

    // Load manage progress routes
    try {
      const manageProgressRoutes = require('./routes/Teachers/ManageProgress/progressRoutes');
      app.use('/api/progress', manageProgressRoutes);
      console.log('✅ Loaded manage progress routes');
    } catch (error) {
      console.warn('⚠️ Could not load manage progress routes:', error.message);
    }

    // Load intervention routes
    try {
      const interventionRoutes = require('./routes/Teachers/ManageProgress/interventionRoutes');
      app.use('/api/interventions', interventionRoutes);
      console.log('✅ Loaded intervention routes');
    } catch (error) {
      console.warn('⚠️ Could not load intervention routes:', error.message);
    }
    
    // Load upload file routes
    try {
      const uploadFileRoutes = require('./routes/Teachers/uploadFile');
      app.use('/api/teachers', uploadFileRoutes);
      console.log('✅ Loaded upload file routes');
    } catch (error) {
      console.warn('⚠️ Could not load upload file routes:', error.message);
    }

    // Load prescriptive analysis routes
    try {
      const prescriptiveAnalysisRoutes = require('./routes/Teachers/ManageProgress/prescriptiveAnalysisRoutes');
      app.use('/api/prescriptive-analysis', prescriptiveAnalysisRoutes);
      console.log('✅ Loaded prescriptive analysis routes');
    } catch (error) {
      console.warn('⚠️ Could not load prescriptive analysis routes:', error.message);
    }

    // Load student routes
    try {
      app.use('/api/student', require('./routes/Teachers/studentRoutes'));
      console.log('✅ Loaded student routes');
    } catch (error) {
      console.warn('⚠️ Could not load student routes:', error.message);
    }

    // Load chatbot routes
    try {
      app.use('/api/chatbot', require('./routes/Teachers/chatbot'));
      console.log('✅ Loaded chatbot routes');
    } catch (error) {
      console.warn('⚠️ Could not load chatbot routes:', error.message);
    }

    // Load dashboard routes
    try {
      const dashboardRoutes = require('./routes/Teachers/dashboardRoutes');
      app.use('/api/dashboard', dashboardRoutes);
      console.log('✅ Loaded dashboard routes');
    } catch (error) {
      console.warn('⚠️ Could not load dashboard routes:', error.message);
    }

    // Load main assessment routes
    try {
      const mainAssessmentRoutes = require('./routes/Teachers/mainAssessmentRoutes');
      app.use('/api/main-assessment', mainAssessmentRoutes);
      console.log('✅ Loaded main assessment routes at /api/main-assessment/*');
    } catch (error) {
      console.warn('⚠️ Could not load main assessment routes:', error.message);
    }

    // Load pre-assessment routes
    try {
      const preAssessmentRoutes = require('./routes/Teachers/preAssessmentRoutes');
      app.use('/api/pre-assessment', preAssessmentRoutes);
      console.log('✅ Loaded pre-assessment routes at /api/pre-assessment/*');
    } catch (error) {
      console.warn('⚠️ Could not load pre-assessment routes:', error.message);
    }

    // Add a test route for the students endpoint
    app.get('/api/admin/manage/students/test', (req, res) => {
      res.json({ message: 'Students endpoint is accessible' });
    });

    // Login route - adapted to work with string roles
    app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;

      /* ── 1. quick validation ─────────────────────────────── */
      if (!email || !password) {
        return res.status(400).json({ message: 'Email & password required' });
      }

      try {
        console.log('🔑 Login attempt:', email);
        
        // First, check in users_web database
        const usersWebDb = mongoose.connection.useDb('users_web');
        const usersCollection = usersWebDb.collection('users');
        
        console.log('Searching for user in DB: users_web');
        console.log('Collection: users');
        console.log('Query:', { email });

        let user = await usersCollection.findOne({ email });
        console.log('User query result:', user ? 'Found' : 'Not found');

        if (!user) {
          console.log('❌ User not found:', email);
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('✅ User found:', user.email);
        
        /* ── 3. Check password ───────────────────────────────── */
        // Determine which field has the password hash
        let passwordField = null;
        let passwordHash = null;
        
        if (user.passwordHash) {
          passwordField = 'passwordHash';
          passwordHash = user.passwordHash;
        } else if (user.password) {
          passwordField = 'password';
          passwordHash = user.password;
        }
        
        if (!passwordHash) {
          console.error('No password hash found for user:', email);
          return res.status(500).json({ message: 'Account configuration error' });
        }
        
        console.log(`Using ${passwordField} field for verification`);
        
        let passwordIsValid = false;
        
        // Verify the password using bcrypt
        if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$')) {
          try {
            passwordIsValid = await bcrypt.compare(password, passwordHash);
            console.log('Password verification result:', passwordIsValid ? 'Valid' : 'Invalid');
          } catch (bcryptError) {
            console.error('Bcrypt error:', bcryptError);
            return res.status(500).json({ message: 'Authentication error' });
          }
        } else {
          console.error('Invalid password hash format for user:', email);
          return res.status(500).json({ message: 'Account configuration error' });
        }
        
        if (!passwordIsValid) {
          console.log('❌ Invalid password for user:', email);
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        /* ── 4. Get user roles ───────────────────────────────── */
        let userRoles = [];
        
        if (user.roles) {
          if (typeof user.roles === 'string') {
            userRoles = [user.roles];
          } else if (Array.isArray(user.roles)) {
            userRoles = user.roles;
          } else if (user.roles.$oid) {
            // It's an ObjectId reference - look it up in the roles collection
            const rolesCollection = usersWebDb.collection('roles');
            const role = await rolesCollection.findOne({ _id: new mongoose.Types.ObjectId(user.roles.$oid) });
            
            if (role && role.name) {
              userRoles.push(role.name);
            }
          }
        }
        
        console.log('User roles:', userRoles);
        
        // If user is a teacher, get additional profile data from teachers database
        let teacherProfile = null;
        if (userRoles.includes('teacher') || userRoles.includes('guro')) {
          try {
            const teachersDb = mongoose.connection.useDb('teachers');
            const profileCollection = teachersDb.collection('profile');
            
            // Try to find by user ID first
            teacherProfile = await profileCollection.findOne({ 
              userId: user._id 
            });
            
            // If not found by ID, try by email
            if (!teacherProfile) {
              teacherProfile = await profileCollection.findOne({ email: user.email });
            }
            
            if (teacherProfile) {
              console.log('Found teacher profile:', teacherProfile._id);
            } else {
              console.log('No teacher profile found for user:', user._id);
            }
          } catch (err) {
            console.warn('Error fetching teacher profile:', err.message);
          }
        }

        /* ── 5. sign JWT ───────────────────────────────────── */
        const secretKey = process.env.JWT_SECRET || 'your-secret-key';
        
        const token = jwt.sign(
          {
            id: user._id.toString(),
            email: user.email,
            roles: userRoles,
            profileId: teacherProfile ? teacherProfile._id.toString() : null
          },
          secretKey,
          { 
            expiresIn: '1h',
            issuer: 'literexia-api',
            subject: user._id.toString()
          }
        );

        console.log('✅ Login success for:', email);
        console.log('User roles for redirection:', userRoles);

        /* ── 6. success response ───────────────────────────── */
        return res.json({
          token,
          user: { 
            id: user._id.toString(), 
            email: user.email, 
            roles: userRoles,
            profile: teacherProfile ? {
              id: teacherProfile._id.toString(),
              firstName: teacherProfile.firstName,
              lastName: teacherProfile.lastName,
              position: teacherProfile.position
            } : null
          }
        });

      } catch (err) {
        console.error('💥 Login handler error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
    });

    // Protected route to test authentication
    app.get('/api/protected', authenticateToken, (req, res) => {
      res.json({
        message: 'Protected route accessed successfully',
        user: req.user
      });
    });

    // Test password verification route
    app.post('/api/auth/test-password', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Test the password
        const isMatch = await bcrypt.compare(password, user.password);

        // Handle roles which might be a string (from DB) or array (converted)
        let userRoles = user.roles;
        if (typeof userRoles === 'string') {
          userRoles = [userRoles]; // Convert string to array for consistency
        }

        return res.json({
          isMatch,
          message: isMatch ? 'Password is valid' : 'Password is invalid',
          user: { id: user._id, email: user.email, roles: userRoles }
        });
      } catch (error) {
        console.error('Error testing password:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
      }
    });

    // Add root route
    app.get('/', (_req, res) => res.send('API is running…'));

    // Add S3 image proxy endpoint
    app.get('/api/proxy-image', async (req, res) => {
      try {
        const { url } = req.query;

        if (!url) {
          return res.status(400).send('Missing URL parameter');
        }

        // Only allow proxying from your S3 bucket for security
        if (!url.includes('literexia-bucket.s3.ap-southeast-2.amazonaws.com')) {
          return res.status(403).send('Unauthorized image source');
        }

        // Fetch the image
        const response = await axios({
          method: 'get',
          url: url,
          responseType: 'arraybuffer'
        });

        // Set proper content type
        const contentType = response.headers['content-type'];
        res.setHeader('Content-Type', contentType);

        // Add cache headers
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

        // Return the image data
        res.send(response.data);
      } catch (error) {
        console.error('Error proxying image:', error);
        res.status(404).send('Image not found');
      }
    });

    // Direct parent lookup endpoint for teacher use
    app.get('/api/parent-by-id/:id', async (req, res) => {
      try {
        const parentId = req.params.id;
        console.log(`[SERVER] Lookup request for parent ID: ${parentId}`);
        
        // Validate MongoDB ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(parentId)) {
          return res.status(400).json({ error: 'Invalid parent ID format' });
        }
        
        // Create ObjectId for queries
        const objectId = new mongoose.Types.ObjectId(parentId);
        
        // Try different databases and collections
        const dbsToSearch = ['Literexia', 'parent', 'users_web'];
        const collectionsToSearch = ['parent', 'parent_profile', 'profile', 'parents'];
        
        let parentData = null;
        
        // Search through databases and collections
        for (const dbName of dbsToSearch) {
          if (parentData) break;
          
          const db = mongoose.connection.useDb(dbName);
          console.log(`[SERVER] Searching in ${dbName} database`);
          
          for (const collName of collectionsToSearch) {
            try {
              const collection = db.collection(collName);
              console.log(`[SERVER] Trying collection ${collName}`);
              
              // Query with ObjectId
              parentData = await collection.findOne({ _id: objectId });
              
              if (parentData) {
                console.log(`[SERVER] Found parent in ${dbName}.${collName}`);
                break;
              }
            } catch (err) {
              console.log(`[SERVER] Error searching ${dbName}.${collName}: ${err.message}`);
            }
          }
        }
        
        if (parentData) {
          // Return the found parent data
          res.json(parentData);
        } else {
          // If parent not found in any database, return fallback data from JSON
          const fallbackParents = [
            {
              _id: "681a2933af165878136e05da",
              firstName: "Jan Mark",
              middleName: "Percival",
              lastName: "Caram",
              email: "parent@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "6827575c89b0d728f9333a20",
              firstName: "Kit Nicholas",
              middleName: "Tongol",
              lastName: "Santiago",
              email: "parent2@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "682ca15af0bfb8e632bdfd13",
              firstName: "Rain",
              middleName: "Percival",
              lastName: "Aganan",
              email: "parentrain@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "682d75b9f7897b64cec98cc7",
              firstName: "Kit Nicholas",
              middleName: "Rish",
              lastName: "Aganan",
              email: "paraaaaaaaaaent@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "6830d880779e20b64f720f44",
              firstName: "Kit Nicholas",
              middleName: "Pascual",
              lastName: "Caram",
              email: "teacher65@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "6835ef1645a2af9158a6d5b7",
              firstName: "Pia",
              middleName: "Zop",
              lastName: "Rey",
              email: "markcaram47@icloud.comm",
              contact: "09155933015"
            }
          ];
          
          // Find matching parent in fallback data
          const fallbackParent = fallbackParents.find(p => p._id === parentId);
          
          if (fallbackParent) {
            console.log(`[SERVER] Using fallback data for parent ID ${parentId}`);
            res.json(fallbackParent);
          } else {
            res.status(404).json({ error: 'Parent not found' });
          }
        }
      } catch (error) {
        console.error('[SERVER] Error in parent lookup:', error);
        res.status(500).json({ error: 'Server error retrieving parent data' });
      }
    });

    // Parent profiles bulk endpoint for teacher use
    app.get('/api/parent-profiles', async (req, res) => {
      try {
        console.log('[SERVER] Bulk parent profiles request');
        
        // First try to get from database
        const parentDb = mongoose.connection.useDb('parent');
        let parentProfiles = [];
        
        try {
          parentProfiles = await parentDb.collection('parent_profile').find({}).toArray();
          console.log(`[SERVER] Found ${parentProfiles.length} parent profiles in database`);
        } catch (dbError) {
          console.log(`[SERVER] Error fetching from database: ${dbError.message}`);
        }
        
        // If no profiles found in database, return fallback data
        if (!parentProfiles || parentProfiles.length === 0) {
          console.log('[SERVER] Using fallback parent profile data');
          parentProfiles = [
            {
              _id: "681a2933af165878136e05da",
              firstName: "Jan Mark",
              middleName: "Percival",
              lastName: "Caram",
              email: "parent@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "6827575c89b0d728f9333a20",
              firstName: "Kit Nicholas",
              middleName: "Tongol",
              lastName: "Santiago",
              email: "parent2@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "682ca15af0bfb8e632bdfd13",
              firstName: "Rain",
              middleName: "Percival",
              lastName: "Aganan",
              email: "parentrain@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "682d75b9f7897b64cec98cc7",
              firstName: "Kit Nicholas",
              middleName: "Rish",
              lastName: "Aganan",
              email: "paraaaaaaaaaent@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "6830d880779e20b64f720f44",
              firstName: "Kit Nicholas",
              middleName: "Pascual",
              lastName: "Caram",
              email: "teacher65@gmail.com",
              contact: "09155933015"
            },
            {
              _id: "6835ef1645a2af9158a6d5b7",
              firstName: "Pia",
              middleName: "Zop",
              lastName: "Rey",
              email: "markcaram47@icloud.comm",
              contact: "09155933015"
            }
          ];
        }
        
        res.json(parentProfiles);
      } catch (error) {
        console.error('[SERVER] Error in bulk parent profiles:', error);
        res.status(500).json({ error: 'Server error retrieving parent profiles' });
      }
    });

    // Get main assessment questions by reading level
    app.get('/api/main-assessment', async (req, res) => {
      try {
        const { readingLevel } = req.query;
        
        if (!readingLevel) {
          return res.status(400).json({ message: 'Reading level parameter is required' });
        }
        
        // Get the test database
        const testDb = mongoose.connection.useDb('test');
        const mainAssessmentCollection = testDb.collection('main_assessment');
        
        // Find all assessment items for this reading level
        const assessmentItems = await mainAssessmentCollection
          .find({ readingLevel })
          .toArray();
        
        if (!assessmentItems || assessmentItems.length === 0) {
          return res.status(404).json({ 
            message: `No assessment items found for reading level: ${readingLevel}` 
          });
        }
        
        return res.json(assessmentItems);
      } catch (error) {
        console.error('Error fetching main assessment data:', error);
        res.status(500).json({ 
          message: 'Error fetching main assessment data', 
          error: error.message 
        });
      }
    });

    // Also add the endpoint to the student routes for alternative access
    app.get('/api/student/main-assessment', async (req, res) => {
      try {
        const { readingLevel } = req.query;
        
        if (!readingLevel) {
          return res.status(400).json({ message: 'Reading level parameter is required' });
        }
        
        // Get the test database
        const testDb = mongoose.connection.useDb('test');
        const mainAssessmentCollection = testDb.collection('main_assessment');
        
        // Find all assessment items for this reading level
        const assessmentItems = await mainAssessmentCollection
          .find({ readingLevel })
          .toArray();
        
        if (!assessmentItems || assessmentItems.length === 0) {
          // Provide fallback data if no items found
          const fallbackItems = [
            {
              readingLevel,
              category: "Phonological Awareness",
              questions: [
                {
                  questionType: "malapantig",
                  questionText: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
                  questionValue: "BO + LA",
                  choiceOptions: [
                    { optionText: "BOLA", isCorrect: true },
                    { optionText: "LABO", isCorrect: false }
                  ],
                  order: 1
                }
              ]
            }
          ];
          return res.json(fallbackItems);
        }
        
        return res.json(assessmentItems);
      } catch (error) {
        console.error('Error fetching main assessment data:', error);
        res.status(500).json({ 
          message: 'Error fetching main assessment data', 
          error: error.message 
        });
      }
    });

    // Register new Admin/categoryResults route
    const categoryResultsRoutes = require('./routes/Admin/categoryResults');
    app.use('/api/admin', categoryResultsRoutes);

    // Register new Admin/assessmentResults route
    const assessmentResultsRoutes = require('./routes/Admin/assessmentResults');
    app.use('/api/admin', assessmentResultsRoutes);
    // Load IEP routes
    try {
      const iepRoutes = require('./routes/Teachers/ManageProgress/iepRoutes');
      app.use('/api/iep', iepRoutes);
      console.log('✅ Loaded IEP routes at /api/iep/*');
    } catch (error) {
      console.warn('⚠️ Could not load IEP routes:', error.message);
    }

    // Load upload routes
    try {
      const uploadRoutes = require('./routes/uploadRoutes');
      app.use('/api/uploads', uploadRoutes);
      console.log('✅ Loaded upload routes at /api/uploads/*');
    } catch (error) {
      console.warn('⚠️ Could not load upload routes:', error.message);
    }

    // 404 handler
    app.use((req, res) => {
      console.log(`[404] Route not found: ${req.method} ${req.url}`);
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(`[ERROR] ${err.message}`);
      res.status(500).json({ error: 'Server error', message: err.message });
    });

  } catch (error) {
    console.error('Error registering routes:', error);
    console.error('Error details:', error.stack);
    process.exit(1);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n✅ Server is running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`API URL: http://localhost:${PORT}`);
});