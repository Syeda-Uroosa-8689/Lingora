import React, {
  useState,
  useEffect,
} from "react";

function LoginPage({ onLogin, onBack, onAdmin, onTeacher, onSuperAdmin }) {

  const [view, setView] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [schoolName, setSchoolName] =
    useState("");

  const [studentClass, setStudentClass] =
    useState("");

  const [classes, setClasses] =
    useState([]);

  const [schools, setSchools] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loginError, setLoginError] =
    useState("");

  const API_URL =
    import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/schools`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSchools(data.schools || []);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/api/classes`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setClasses(data.classes || []);
        }
      })
      .catch(() => {});
  }, [API_URL]);

  function resetError() {
    setLoginError("");
  }

  async function handleLogin() {

    resetError();

    if (
      !email.trim() ||
      !password.trim()
    ) {
      setLoginError(
        "Please enter Email and Password"
      );
      return;
    }

    setLoading(true);

    try {

      const response =
        await fetch(
          `${API_URL}/api/login`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              email,
              password
            })
          }
        );

      const data =
        await response.json();

      if (data.success) {

        localStorage.setItem(
          "userName",
          data.user.fullName ||
            email
        );

        localStorage.setItem(
          "userEmail",
          data.user.email
        );

          localStorage.setItem(
            "userRole",
            data.user.role ||
              "student"
          );

          localStorage.setItem(
            "loggedIn",
            "true"
          );

          if (
            data.user.role === "admin"
          ) {
            localStorage.setItem(
              "adminToken",
              data.token
            );
            localStorage.setItem(
              "adminSchoolId",
              data.user.schoolId ||
                ""
            );
            onAdmin();
        } else if (
          data.user.role ===
          "teacher"
        ) {
          localStorage.setItem(
            "teacherToken",
            data.token
          );
          localStorage.setItem(
            "teacherSchoolId",
            data.user.schoolId ||
              ""
          );
          onTeacher();
         } else if (
           data.user.role ===
           "superadmin"
         ) {
           localStorage.setItem(
             "superAdminToken",
             data.token
           );
           onSuperAdmin();
         } else {
           onLogin();
         }
      } else {

        if (
          data.awaitingApproval
        ) {
          setLoginError(
            "Awaiting Admin Approval"
          );
        } else {
          setLoginError(
            data.message ||
              "Login failed"
          );
        }

      }

    } catch (error) {

      setLoginError(
        "Backend server not running!"
      );

      console.error(
        "Login Error:",
        error
      );

    }

    setLoading(false);

  }

  async function handleRegister() {

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      alert(
        "Please fill all required fields"
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      alert(
        "Passwords do not match"
      );
      return;
    }

    if (
      password.length < 6
    ) {
      alert(
        "Password must be at least 6 characters"
      );
      return;
    }

    setLoading(true);

    try {

      const response =
        await fetch(
          `${API_URL}/api/register`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
               body: JSON.stringify({
                 fullName,
                 email,
                 mobile,
                 password,
                 confirmPassword,
                 schoolName,
                 class: studentClass,
               })
          }
        );

      const data =
        await response.json();

      if (data.success) {
        alert(
          "Registration successful. Awaiting admin approval."
        );
          setView("login");
          setEmail(email);
          setFullName("");
          setMobile("");
          setPassword("");
          setConfirmPassword("");
          setSchoolName("");
          setStudentClass("");
      } else {
        alert(
          data.message ||
            "Registration failed"
        );
      }

    } catch (error) {

      console.error(
        "Register Error:",
        error
      );

      alert(
        "Backend server not running!"
      );

    }

    setLoading(false);

  }

  return (
    <div className="auth-page">

      <div className="auth-card">

        {view === "login" && (
          <>

            <h1>
              Welcome Back 🌟
            </h1>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={
                (e) =>
                  setEmail(
                    e.target.value
                  )
              }
             />

             <input
               type="password"
               placeholder="Password"
               value={password}
               onChange={
                 (e) =>
                   setPassword(
                     e.target.value
                   )
               }
             />

             {loginError && (
              <div
                className="auth-error"
              >
                {loginError}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : "Login"}
            </button>

            <button
              className="back-btn"
              onClick={onBack}
            >
              Back
            </button>

            <div className="auth-toggle">
              <span>
                Don't have an account?
              </span>
              <button className="link-btn" onClick={() => { setView("signup"); setLoginError(""); }}>
                Sign Up
              </button>
            </div>

          </>
        )}

        {view === "signup" && (
          <>

            <h1>
              Create Account ✨
            </h1>

            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={
                (e) =>
                  setFullName(
                    e.target.value
                  )
              }
            />

             <input
               type="email"
               placeholder="Email"
               value={email}
               onChange={
                 (e) =>
                   setEmail(
                     e.target.value
                   )
               }
             />

              <select
                value={schoolName}
                onChange={
                  (e) =>
                    setSchoolName(
                      e.target.value
                    )
                }
              >
                <option value="">
                  Select School
                </option>
                {schools.map((s) => (
                  <option
                    key={s.schoolId}
                    value={s.name}
                  >
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={studentClass}
                onChange={
                  (e) =>
                    setStudentClass(
                      e.target.value
                    )
                }
              >
                <option value="">
                  Select Class
                </option>
                {classes.map((c) => (
                  <option
                    key={c._id}
                    value={c.name}
                  >
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="tel"
                placeholder="Mobile Number"
               value={mobile}
               onChange={
                 (e) =>
                   setMobile(
                     e.target.value
                   )
               }
             />

             <input
               type="password"
              placeholder="Password"
              value={password}
              onChange={
                (e) =>
                  setPassword(
                    e.target.value
                  )
              }
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={
                (e) =>
                  setConfirmPassword(
                    e.target.value
                  )
              }
            />

            <button
              onClick={handleRegister}
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : "Sign Up"}
            </button>

            <button
              className="back-btn"
              onClick={
                () => setView("login")
              }
            >
              Back
            </button>

            <div
              className="auth-toggle"
            >
              <span>
                Already have an account?
              </span>
              <button
                className="link-btn"
                onClick={
                  () => setView("login")
                }
              >
                Login
              </button>
            </div>

          </>
        )}

      </div>

    </div>
  );
}

export default LoginPage;