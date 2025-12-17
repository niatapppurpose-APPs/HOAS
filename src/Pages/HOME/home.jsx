import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <h1>Welcome to HOAS</h1>
      <p>This is the Home Page</p>
      <nav>
        <Link to="/login">Go to Login</Link>
        {" | "}
        <Link to="/role">Get Start</Link>
      </nav>
    </div>
  );
};

export default Home