const bcrypt = require('bcrypt');

/**
 * Compares a plain text password with a hashed password.
 * @param {string} plainPassword - The user's input password.
 * @param {string} hashedPassword - The hashed password stored in the database.
 * @returns {Promise<boolean>} - Returns true if the password matches, false otherwise.
 */
async function checkPassword(plainPassword, hashedPassword) {
    try {
        const match = await bcrypt.compare(plainPassword, hashedPassword);
        return match;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
}

// Example usage
(async () => {
    const inputPassword = 'Admin101@'; // password entered by the user
    const storedHashedPassword = '$2a$10$18VwZOzogiLIT6vhsvHkl.N1Uqi0k1XuIikmouXz6gWgTiAAvbm.O'; // example hash

    const isValid = await checkPassword(inputPassword, storedHashedPassword);
    console.log('Password is valid:', isValid);
})();

module.exports = checkPassword;
