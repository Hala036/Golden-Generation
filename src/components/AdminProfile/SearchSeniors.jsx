import React, { useState } from 'react';
import { Input, Select, Button, Slider, Card } from 'antd';
import { FaSearch, FaFilter, FaClear } from 'react-icons/fa';

const { Option } = Select;

const SearchSeniors = () => {
  const [filters, setFilters] = useState({
    name: '',
    ageRange: [60, 80],
    city: '',
    interests: [],
    workFields: []
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock data for dropdowns
  const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beersheba', 'Netanya', 'Ashdod'];
  const interestOptions = ['Technology', 'Gardening', 'Arts', 'Cooking', 'Sports', 'Music', 'Reading', 'Travel'];
  const workFieldOptions = ['Engineering', 'Education', 'Medicine', 'Business', 'Arts', 'Technology', 'Consulting'];

  const handleSearch = async () => {
    setIsSearching(true);
    
    // Mock search logic - replace with actual Firebase query
    setTimeout(() => {
      const mockResults = [
        {
          id: '1',
          name: 'David Cohen',
          age: 67,
          city: 'Tel Aviv',
          interests: ['Technology', 'Gardening'],
          workFields: ['Engineering'],
          phone: '+972-50-123-4567',
          email: 'david.cohen@email.com'
        },
        {
          id: '2',
          name: 'Sarah Levy',
          age: 72,
          city: 'Jerusalem',
          interests: ['Arts', 'Cooking'],
          workFields: ['Education'],
          phone: '+972-54-987-6543',
          email: 'sarah.levy@email.com'
        }
      ].filter(senior => {
        // Apply filters
        if (filters.name && !senior.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
        if (senior.age < filters.ageRange[0] || senior.age > filters.ageRange[1]) return false;
        if (filters.city && senior.city !== filters.city) return false;
        if (filters.interests.length > 0 && !filters.interests.some(interest => senior.interests.includes(interest))) return false;
        if (filters.workFields.length > 0 && !filters.workFields.some(field => senior.workFields.includes(field))) return false;
        return true;
      });

      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1000);
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      ageRange: [60, 80],
      city: '',
      interests: [],
      workFields: []
    });
    setSearchResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card title="Advanced Search Filters" className="shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              placeholder="Enter senior's name"
              value={filters.name}
              onChange={(e) => setFilters({...filters, name: e.target.value})}
              prefix={<FaSearch className="text-gray-400" />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">City/Village</label>
            <Select
              placeholder="Select city"
              value={filters.city}
              onChange={(value) => setFilters({...filters, city: value})}
              className="w-full"
              allowClear
            >
              {cities.map(city => (
                <Option key={city} value={city}>{city}</Option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Age Range: {filters.ageRange[0]} - {filters.ageRange[1]} years
            </label>
            <Slider
              range
              min={50}
              max={100}
              value={filters.ageRange}
              onChange={(value) => setFilters({...filters, ageRange: value})}
              marks={{
                50: '50',
                60: '60',
                70: '70',
                80: '80',
                90: '90',
                100: '100+'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Areas of Interest</label>
            <Select
              mode="multiple"
              placeholder="Select interests"
              value={filters.interests}
              onChange={(value) => setFilters({...filters, interests: value})}
              className="w-full"
            >
              {interestOptions.map(interest => (
                <Option key={interest} value={interest}>{interest}</Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Work Domains</label>
            <Select
              mode="multiple"
              placeholder="Select work fields"
              value={filters.workFields}
              onChange={(value) => setFilters({...filters, workFields: value})}
              className="w-full"
            >
              {workFieldOptions.map(field => (
                <Option key={field} value={field}>{field}</Option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button 
            type="primary" 
            icon={<FaSearch />}
            onClick={handleSearch}
            loading={isSearching}
            className="bg-yellow-500 border-yellow-500"
          >
            Search Seniors
          </Button>
          <Button 
            icon={<FaClear />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card title={`Search Results (${searchResults.length} found)`} className="shadow-sm">
          <div className="space-y-4">
            {searchResults.map((senior) => (
              <div key={senior.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{senior.name}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Age:</span> {senior.age} years
                      </div>
                      <div>
                        <span className="font-medium">City:</span> {senior.city}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {senior.phone}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {senior.email}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Interests: </span>
                        {senior.interests.map((interest, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1">
                            {interest}
                          </span>
                        ))}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Work Fields: </span>
                        {senior.workFields.map((field, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-1">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="small" type="primary">
                      View Details
                    </Button>
                    <Button size="small">
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {searchResults.length === 0 && !isSearching && (
        <div className="text-center text-gray-500 py-8">
          <FaFilter className="text-4xl mx-auto mb-4 text-gray-300" />
          <p>Use the filters above to search for seniors</p>
        </div>
      )}
    </div>
  );
};

export default SearchSeniors;