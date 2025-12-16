import {useNavigate } from "react-router"
import "./userrole.css"
import { useState } from "react"


const UserRole = () => {
  const [role, setUserRole] = useState("");
  const navigate = useNavigate();
  const options = { replace: true }
  const handleContinue = () => {
   navigate(`/profile/${role}`)
  }

  return (
    <div>
      <h2>Select your role</h2>

      <select onChange={(e) => setUserRole(e.target.value)}>
        <option value="">Select</option>
        <option value="student-profile">Student</option>
        <option value="warden-profile">Warden</option>
        <option value="management-profile">Management</option>
      </select>


      <button disabled={!role} onClick={handleContinue}>
        Continue
      </button>
    </div>

  )
}

export default UserRole