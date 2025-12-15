import { Link, useNavigate } from "react-router"
import "./userrole.css"
import { useState } from "react"


const UserRole = () => {
  const [role, setUserRole] = useState("");
  const navigate = useNavigate();
  const options = { replace: true }
  const handleContinue = () => {
    if (role === "student") {
      navigate('/student-profile', options)

    } else if (role === "warden") {
      navigate('/warden-profile', options)

    } else if (role === "management") {
      navigate('/management-profile', options)

    }
  }

  return (
    <div>
      <h2>Select your role</h2>

      <label>
        <input
          type="input"
          name="role"
          value={null && ("student" || "warden" || "management")}
          onChange={(e) => setUserRole(e.target.value)}
        />

      </label>

      <button disabled={!role} onClick={handleContinue}>
        Continue
      </button>
    </div>

  )
}

export default UserRole