import React from "react";

const ProfileDetails = ({ retireeData }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Profile Details</h2>
      <p><strong>Name:</strong> {retireeData.idVerification.firstName}</p>
      <p><strong>Age:</strong> {retireeData.idVerification.age}</p>
      <p><strong>Gender:</strong> {retireeData.idVerification.gender}</p>
      {/* <p><strong>Work Background:</strong> {retireeData.workBackground}</p> */}
    </div>
  );
};

export default ProfileDetails;