// Tested /api/auth/me by first creating a new user via /signup, logging in via /login to get the access token (cookie), and then using it to fetch user details.

const request = require("supertest");

beforeAll(() => {
  require("../../server");
});

describe("Auth API", () => {
  let cookies;
  const testUser = {
    name: "Vivek Test User",
    username: "vivek_testuser_" + Date.now(), // unique username each run
    email: "vivek_test" + Date.now() + "@example.com",
    password: "password123",
  };

  describe("POST /api/auth/signup", () => {
    it("should create a new user", async () => {
      const res = await request("http://localhost:8000")
        .post("/api/auth/signup")
        .send(testUser);

      console.log("Signup response:", res.body);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("email", testUser.email);
      expect(res.body).toHaveProperty("username", testUser.username);
    });

    it("should fail with duplicate email or username", async () => {
      const res = await request("http://localhost:8000")
        .post("/api/auth/signup")
        .send(testUser);

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return success and set cookies for valid credentials", async () => {
      const res = await request("http://localhost:8000")
        .post("/api/auth/login")
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password,
        });

      console.log("Login response:", res.body);
      console.log("Login cookies:", res.headers["set-cookie"]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);

      cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
    });

    it("should return 404 for invalid credentials", async () => {
      const res = await request("http://localhost:8000")
        .post("/api/auth/login")
        .send({
          emailOrUsername: "wrong@example.com",
          password: "wrongpass",
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user details with valid cookie token", async () => {
      const res = await request("http://localhost:8000")
        .get("/api/auth/me")
        .set("Cookie", cookies);

      console.log("Me response:", res.body);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("userId");
      expect(res.body).toHaveProperty("username", testUser.username);
    });

    it("should fail without cookie", async () => {
      const res = await request("http://localhost:8000").get("/api/auth/me");
      expect(res.statusCode).toBe(401);
    });
  });
});