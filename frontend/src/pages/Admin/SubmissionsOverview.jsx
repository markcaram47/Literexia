// src/components/Admin/Submissions/SubmissionsOverview.jsx
import React, { useState, useEffect } from 'react';
import '../../css/Admin/Dashboard/SubmissionsOverview.css'; 
import {
  FileCheck,
  XCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertCircle,
  MoreHorizontal,
  FileText,
  User,
  BookOpen
} from 'lucide-react';

// Mock service for teacher activity proposals
const mockProposalsService = {
  async getProposals(filter = '') {
    await new Promise(resolve => setTimeout(resolve, 500));
    const proposals = [
      {
        id: 'PRO001',
        activityTitle: 'Mga Uri ng Pangungusap',
        activityType: 'Worksheet',
        description: "Worksheet para sa iba't ibang uri ng pangungusap.",
        teacherName: 'Mr. Dela Cruz',
        dateSubmitted: new Date('2024-11-17T10:30:00'),
        status: 'pending',
        attachments: 1,
      },
      {
        id: 'PRO002',
        activityTitle: 'Salitang Naglalarawan',
        activityType: 'Quiz',
        description: 'Maikling pagsusulit tungkol sa mga salitang naglalarawan.',
        teacherName: 'Ms. Santos',
        dateSubmitted: new Date('2024-11-16T14:15:00'),
        status: 'approved',
        attachments: 0,
      },
      {
        id: 'PRO003',
        activityTitle: 'Pangngalan',
        activityType: 'Assignment',
        description: 'Takdang-aralin ukol sa pangngalan.',
        teacherName: 'Ms. Lim',
        dateSubmitted: new Date('2024-11-16T09:45:00'),
        status: 'pending',
        attachments: 2,
      },
      {
        id: 'PRO004',
        activityTitle: 'Pandiwa',
        activityType: 'Practice',
        description: 'Practice activity para sa pandiwa.',
        teacherName: 'Mr. Gomez',
        dateSubmitted: new Date('2024-11-15T16:20:00'),
        status: 'rejected',
        attachments: 1,
        rejectionReason: 'Incomplete instructions.'
      },
    ];
    return proposals.filter(proposal =>
      proposal.activityTitle.toLowerCase().includes(filter.toLowerCase()) ||
      proposal.teacherName.toLowerCase().includes(filter.toLowerCase())
    );
  },
};

const SubmissionsOverview = () => {
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [proposals, searchQuery, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const proposalsData = await mockProposalsService.getProposals();
      setProposals(proposalsData);
    } catch (err) {
      setError('Failed to load proposals data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...proposals];
    if (searchQuery) {
      filtered = filtered.filter(proposal =>
        proposal.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }
    setFilteredProposals(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="proposal-status-badge proposal-status-pending">Pending</span>;
      case 'approved':
        return <span className="proposal-status-badge proposal-status-approved">Approved</span>;
      case 'rejected':
        return <span className="proposal-status-badge proposal-status-rejected">Rejected</span>;
      default:
        return null;
    }
  };

  const handleApprove = async (proposalId) => {
    setActionLoading(true);
    setTimeout(() => {
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'approved', rejectionReason: undefined } : p));
      setSelectedProposal(null);
      setActionLoading(false);
    }, 700);
  };

  const handleReject = async (proposalId, reason) => {
    if (!reason.trim()) {
      // Show error if rejection reason is empty
      alert("Please provide a reason for rejection");
      return;
    }
    
    setActionLoading(true);
    setTimeout(() => {
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'rejected', rejectionReason: reason } : p));
      setSelectedProposal(null);
      setRejectComment('');
      setActionLoading(false);
    }, 700);
  };

  // Pagination
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProposals = filteredProposals.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="proposal-container">
        <div className="proposal-loading">
          <div className="proposal-loading-spinner"></div>
          <p>Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="proposal-container">
        <div className="proposal-error">
          <XCircle className="proposal-error-icon" />
          <h3>Unable to Load Data</h3>
          <p>{error}</p>
          <button onClick={fetchData} className="proposal-retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-container">
      {/* Info Banner */}
      <div className="proposal-info-banner">
        <div className="proposal-info-icon">
          <FileCheck size={28} />
        </div>
        <div className="proposal-info-content">
          <h3>Activity Proposals Review</h3>
          <p>
            Review teacher-submitted activities before they become available to students. 
            Approve suitable content or reject with feedback for improvements.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="proposal-stats-grid">
        <div className="proposal-stat-card">
          <div className="proposal-stat-icon">
            <FileText />
          </div>
          <div className="proposal-stat-content">
            <h3>Total Proposals</h3>
            <p className="proposal-stat-value">{proposals.length}</p>
          </div>
        </div>
        
        <div className="proposal-stat-card">
          <div className="proposal-stat-icon">
            <Clock />
          </div>
          <div className="proposal-stat-content">
            <h3>Pending Review</h3>
            <p className="proposal-stat-value">{proposals.filter(p => p.status === 'pending').length}</p>
          </div>
        </div>
        
        <div className="proposal-stat-card">
          <div className="proposal-stat-icon">
            <CheckCircle />
          </div>
          <div className="proposal-stat-content">
            <h3>Approved</h3>
            <p className="proposal-stat-value">{proposals.filter(p => p.status === 'approved').length}</p>
          </div>
        </div>
        
        <div className="proposal-stat-card">
          <div className="proposal-stat-icon">
            <XCircle />
          </div>
          <div className="proposal-stat-content">
            <h3>Rejected</h3>
            <p className="proposal-stat-value">{proposals.filter(p => p.status === 'rejected').length}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="proposal-controls">
        <div className="proposal-search">
          <Search size={20} className="proposal-search-icon" />
          <input
            type="text"
            placeholder="Search by activity title or teacher name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="proposal-search-input"
          />
        </div>
        <button
          className="proposal-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {showFilters && (
        <div className="proposal-filters-panel">
          <div className="proposal-filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="proposal-filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button 
            className="proposal-clear-filters"
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Proposals Table */}
      <div className="proposal-table-container">
        <table className="proposal-table">
          <thead>
            <tr>
              <th>Activity Title</th>
              <th>Type</th>
              <th>Description</th>
              <th>Teacher</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentProposals.length > 0 ? (
              currentProposals.map((proposal) => (
                <tr key={proposal.id} className="proposal-row">
                  <td className="proposal-title">{proposal.activityTitle}</td>
                  <td><span className="proposal-type-badge">{proposal.activityType}</span></td>
                  <td className="proposal-description">{proposal.description.length > 40 ? proposal.description.slice(0, 40) + '...' : proposal.description}</td>
                  <td className="proposal-teacher">{proposal.teacherName}</td>
                  <td className="proposal-date">
                    {new Date(proposal.dateSubmitted).toLocaleDateString('en-PH', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td>{getStatusBadge(proposal.status)}</td>
                  <td>
                    <button
                      className="proposal-view-button"
                      onClick={() => setSelectedProposal(proposal)}
                      title="View Details"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="proposal-empty-state">
                  <div className="proposal-empty-content">
                    <FileText size={32} />
                    <p>No proposals match your search criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredProposals.length > 0 && (
        <div className="proposal-pagination">
          <div className="proposal-pagination-info">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredProposals.length)} of {filteredProposals.length} proposals
          </div>
          <div className="proposal-pagination-controls">
            <button
              className="proposal-pagination-button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="proposal-pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`proposal-pagination-number ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="proposal-pagination-button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Process Note */}
      <div className="proposal-process-note">
        <BookOpen className="proposal-process-note-icon" />
        <div className="proposal-process-note-text">
          <p>
            <strong>Approval Process:</strong> Review each submission carefully for appropriateness, 
            educational value, and alignment with curriculum standards. If rejecting, 
            provide clear feedback to help teachers improve their submissions.
          </p>
        </div>
      </div>

      {/* Detailed View Modal */}
      {selectedProposal && (
        <div className="proposal-modal-overlay">
          <div className="proposal-modal">
            <div className="proposal-modal-header">
              <h2>Activity Proposal Details</h2>
              <button
                className="proposal-modal-close"
                onClick={() => setSelectedProposal(null)}
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="proposal-modal-body">
              <div className="proposal-detail-section">
                <h3>Activity Information</h3>
                <div className="proposal-detail-grid">
                  <div className="proposal-detail-item">
                    <label>Title</label>
                    <span>{selectedProposal.activityTitle}</span>
                  </div>
                  <div className="proposal-detail-item">
                    <label>Type</label>
                    <span><span className="proposal-type-badge-modal">{selectedProposal.activityType}</span></span>
                  </div>
                  <div className="proposal-detail-item">
                    <label>Description</label>
                    <span className="proposal-full-description">{selectedProposal.description}</span>
                  </div>
                  <div className="proposal-detail-item">
                    <label>Teacher</label>
                    <span className="proposal-teacher-info">
                      <User size={16} className="proposal-teacher-icon" />
                      {selectedProposal.teacherName}
                    </span>
                  </div>
                  <div className="proposal-detail-item">
                    <label>Date Submitted</label>
                    <span>{new Date(selectedProposal.dateSubmitted).toLocaleString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="proposal-detail-item">
                    <label>Status</label>
                    <span>{getStatusBadge(selectedProposal.status)}</span>
                  </div>
                  {selectedProposal.attachments > 0 && (
                    <div className="proposal-detail-item">
                      <label>Attachments</label>
                      <span className="proposal-attachments">
                        {selectedProposal.attachments} file{selectedProposal.attachments > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedProposal.status === 'rejected' && selectedProposal.rejectionReason && (
                <div className="proposal-detail-section proposal-rejection-section">
                  <h3>Rejection Reason</h3>
                  <div className="proposal-rejection-details">
                    <AlertCircle size={20} className="proposal-rejection-icon" />
                    <p>{selectedProposal.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="proposal-modal-footer">
              {selectedProposal.status === 'pending' ? (
                <div className="proposal-action-buttons">
                  <div className="proposal-reject-container">
                    <input
                      type="text"
                      className="proposal-reject-reason"
                      placeholder="Reason for rejection (required)"
                      value={rejectComment}
                      onChange={e => setRejectComment(e.target.value)}
                    />
                    <button
                      className="proposal-action-button proposal-reject-button"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedProposal.id, rejectComment)}
                    >
                      {actionLoading ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                  <div className="proposal-button-group">
                    <button 
                      className="proposal-action-button proposal-close-button"
                      onClick={() => setSelectedProposal(null)}
                    >
                      Close
                    </button>
                    <button
                      className="proposal-action-button proposal-approve-button"
                      disabled={actionLoading}
                      onClick={() => handleApprove(selectedProposal.id)}
                    >
                      {actionLoading ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="proposal-action-button proposal-close-button proposal-single-close"
                  onClick={() => setSelectedProposal(null)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsOverview;