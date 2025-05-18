import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input, Tag, Space, Modal, List, Avatar } from 'antd';
import { FaSearch, FaUserCheck, FaMapMarkerAlt, FaBriefcase, FaPhone, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const { Option } = Select;

const MatchmakingPanel = () => {
  const [jobRequests, setJobRequests] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [isMatchModalVisible, setIsMatchModalVisible] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    domain: '',
    availability: ''
  });

  // Mock data
  useEffect(() => {
    const mockJobs = [
      {
        id: '1',
        title: 'Medical Escort Needed',
        type: 'Direct Help',
        domain: 'Medical',
        description: 'Need someone to accompany elderly person to medical appointments',
        location: 'Tel Aviv',
        status: 'Open'
      },
      {
        id: '2',
        title: 'Home Repair Volunteer',
        type: 'Volunteer Request',
        domain: 'Home Maintenance',
        description: 'Looking for volunteers to help with minor home repairs',
        location: 'Jerusalem',
        status: 'Open'
      },
      {
        id: '3',
        title: 'Tech Support Help',
        type: 'Direct Help',
        domain: 'Technology',
        description: 'Senior needs help with smartphone setup',
        location: 'Haifa',
        status: 'In Progress'
      }
    ];

    const mockSeniors = [
      {
        id: '1',
        name: 'David Cohen',
        age: 67,
        phone: '+972-50-123-4567',
        email: 'david.cohen@email.com',
        city: 'Tel Aviv',
        interests: ['Technology', 'Medicine'],
        workFields: ['Engineering', 'Healthcare'],
        availability: 'Part-time',
        experience: '15 years in engineering, medical device development'
      },
      {
        id: '2',
        name: 'Sarah Levy',
        age: 72,
        phone: '+972-54-987-6543',
        email: 'sarah.levy@email.com',
        city: 'Jerusalem',
        interests: ['Arts', 'Education'],
        workFields: ['Education', 'Art Therapy'],
        availability: 'Flexible',
        experience: '30 years in education, art therapy certification'
      },
      {
        id: '3',
        name: 'Michael Ben-David',
        age: 65,
        phone: '+972-52-555-1234',
        email: 'michael.bendavid@email.com',
        city: 'Tel Aviv',
        interests: ['Technology', 'Teaching'],
        workFields: ['Technology', 'Consulting'],
        availability: 'Full-time',
        experience: 'IT consultant, 20 years experience'
      }
    ];

    setJobRequests(mockJobs);
    setSeniors(mockSeniors);
  }, []);

  const findMatches = (job) => {
    const matches = seniors.filter(senior => {
      // Location match
      if (senior.city !== job.location) return false;
      
      // Domain/Interest match
      const domainMatch = senior.workFields.some(field => 
        field.toLowerCase().includes(job.domain.toLowerCase()) ||
        job.domain.toLowerCase().includes(field.toLowerCase())
      ) || senior.interests.some(interest =>
        interest.toLowerCase().includes(job.domain.toLowerCase()) ||
        job.domain.toLowerCase().includes(interest.toLowerCase())
      );

      // Apply search filters
      if (searchFilters.location && senior.city !== searchFilters.location) return false;
      if (searchFilters.domain && !senior.workFields.includes(searchFilters.domain)) return false;
      if (searchFilters.availability && senior.availability !== searchFilters.availability) return false;

      return domainMatch;
    });

    return matches.map(senior => ({
      ...senior,
      matchScore: calculateMatchScore(senior, job)
    })).sort((a, b) => b.matchScore - a.matchScore);
  };

  const calculateMatchScore = (senior, job) => {
    let score = 0;
    
    // Location match (high priority)
    if (senior.city === job.location) score += 40;
    
    // Work field match
    const workFieldMatch = senior.workFields.some(field => 
      field.toLowerCase().includes(job.domain.toLowerCase())
    );
    if (workFieldMatch) score += 30;
    
    // Interest match
    const interestMatch = senior.interests.some(interest =>
      interest.toLowerCase().includes(job.domain.toLowerCase())
    );
    if (interestMatch) score += 20;
    
    // Availability bonus
    if (senior.availability === 'Full-time') score += 10;
    if (senior.availability === 'Flexible') score += 5;
    
    return score;
  };

  const handleFindMatches = (job) => {
    setSelectedJob(job);
    const matches = findMatches(job);
    setMatchedCandidates(matches);
    setIsMatchModalVisible(true);
  };

  const handleAssignCandidate = (candidate) => {
    toast.success(`${candidate.name} has been assigned to "${selectedJob.title}"`);
    setIsMatchModalVisible(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    if (score >= 40) return 'blue';
    return 'red';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Matchmaking System</h3>
        <div className="text-sm text-gray-600">
          Find the best candidates for job requests
        </div>
      </div>

      {/* Search Filters */}
      <Card title="Search Filters" size="small">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <Select
              placeholder="Filter by location"
              value={searchFilters.location}
              onChange={(value) => setSearchFilters({...searchFilters, location: value})}
              className="w-full"
              allowClear
            >
              <Option value="Tel Aviv">Tel Aviv</Option>
              <Option value="Jerusalem">Jerusalem</Option>
              <Option value="Haifa">Haifa</Option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Domain</label>
            <Select
              placeholder="Filter by domain"
              value={searchFilters.domain}
              onChange={(value) => setSearchFilters({...searchFilters, domain: value})}
              className="w-full"
              allowClear
            >
              <Option value="Technology">Technology</Option>
              <Option value="Medical">Medical</Option>
              <Option value="Education">Education</Option>
              <Option value="Engineering">Engineering</Option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Availability</label>
            <Select
              placeholder="Filter by availability"
              value={searchFilters.availability}
              onChange={(value) => setSearchFilters({...searchFilters, availability: value})}
              className="w-full"
              allowClear
            >
              <Option value="Full-time">Full-time</Option>
              <Option value="Part-time">Part-time</Option>
              <Option value="Flexible">Flexible</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Job Requests */}
      <Card title="Open Job Requests">
        <div className="grid gap-4">
          {jobRequests.filter(job => job.status === 'Open').map((job) => (
            <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">{job.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <FaBriefcase className="text-gray-400" />
                      <span>{job.domain}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <span>{job.location}</span>
                    </div>
                    <Tag color="blue">{job.type}</Tag>
                  </div>
                  <p className="text-gray-600 mt-2">{job.description}</p>
                </div>
                <Button 
                  type="primary"
                  icon={<FaUserCheck />}
                  onClick={() => handleFindMatches(job)}
                  className="bg-yellow-500 border-yellow-500"
                >
                  Find Matches
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Matches Modal */}
      <Modal
        title={`Matching Candidates for: ${selectedJob?.title}`}
        open={isMatchModalVisible}
        onCancel={() => setIsMatchModalVisible(false)}
        footer={null}
        width={800}
      >
        {matchedCandidates.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={matchedCandidates}
            renderItem={(candidate) => (
              <List.Item
                actions={[
                  <Button 
                    key="contact"
                    icon={<FaPhone />}
                    size="small"
                  >
                    Contact
                  </Button>,
                  <Button 
                    key="assign"
                    type="primary"
                    icon={<FaUserCheck />}
                    onClick={() => handleAssignCandidate(candidate)}
                    className="bg-green-500 border-green-500"
                    size="small"
                  >
                    Assign
                  </Button>
                ]}
                extra={
                  <Tag color={getScoreColor(candidate.matchScore)}>
                    Match: {candidate.matchScore}%
                  </Tag>
                }
              >
                <List.Item.Meta
                  avatar={<Avatar size={64} src={`/api/placeholder/64/64`} />}
                  title={
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold">{candidate.name}</span>
                      <span className="text-sm text-gray-500">({candidate.age} years)</span>
                    </div>
                  }
                  description={
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span>{candidate.city}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaPhone className="text-gray-400" />
                          <span>{candidate.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaEnvelope className="text-gray-400" />
                          <span>{candidate.email}</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Work Fields: </span>
                        {candidate.workFields.map((field, index) => (
                          <Tag key={index} color="blue" className="mr-1">
                            {field}
                          </Tag>
                        ))}
                      </div>
                      <div>
                        <span className="font-medium">Interests: </span>
                        {candidate.interests.map((interest, index) => (
                          <Tag key={index} color="green" className="mr-1">
                            {interest}
                          </Tag>
                        ))}
                      </div>
                      <div>
                        <span className="font-medium">Availability: </span>
                        <Tag color="orange">{candidate.availability}</Tag>
                      </div>
                      <div>
                        <span className="font-medium">Experience: </span>
                        <span className="text-gray-600">{candidate.experience}</span>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div className="text-center py-8">
            <FaUserCheck className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No matching candidates found</p>
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting the search filters or the job requirements
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MatchmakingPanel;