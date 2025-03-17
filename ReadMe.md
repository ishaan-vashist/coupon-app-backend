# Coupon App Backend

This repository contains the backend for the Coupon App—a full-stack project designed for a Full-Stack Developer Internship. The backend provides endpoints for coupon distribution, abuse prevention, and admin functionalities to manage coupons.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
  - [Coupon Endpoints (Guest User)](#coupon-endpoints-guest-user)
  - [Admin Endpoints](#admin-endpoints)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Repository Structure](#repository-structure)
- [Repository Structure for Full-Stack Projects](#repository-structure-for-full-stack-projects)

---

## Features

- **Coupon Distribution:**  
  - Round-robin assignment of coupons.
  - Marks coupons as "claimed" and records the user’s IP address.
  
- **Abuse Prevention:**  
  - IP-based check to prevent multiple claims from the same IP.
  - Cookie-based check to restrict multiple claims from the same browser session.

- **Admin Panel Endpoints:**  
  - Secure admin login with JWT authentication.
  - View all coupons, including claim history.
  - Add new coupons.
  - Update coupon details (toggle availability, update coupon code).

---

## Tech Stack

- **Backend Framework:** Node.js, Express
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT
- **Security:** IP and cookie-based abuse prevention
- **Other:** dotenv for configuration, cookie-parser for handling cookies

---

## Installation

1. **Clone the Repository:**

   ```sh
   git clone <repository_url>
   cd coupon-app-backend
   ```

2. **Install Dependencies:**

   ```sh
   npm install
   ```

3. **Create a `.env` File:**

   In the root directory, create a file named `.env` with the following content:

   ```env
   PORT=5000
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_jwt_secret>
   ```

---

## Running the Application

### Development Mode

Use `nodemon` for auto-reloading on code changes:

```sh
npm run dev
```

### Production Mode

Start the application with:

```sh
node server.js
```

---

## API Endpoints

### Coupon Endpoints (Guest User)

- **Claim a Coupon**
  - **Endpoint:** `GET /api/coupons/claim`
  - **Description:** Claims the next available coupon using round-robin logic.
  - **Abuse Prevention:**  
    - Checks IP address to allow only one claim per IP.
    - Checks for a `claimed` cookie to prevent multiple claims from the same browser session.
  - **Response:**
    - **Success:** `{ "coupon": "COUPON_CODE" }`
    - **Errors:**  
      - `404` – No coupons available  
      - `429` – Wait before claiming again (either IP or browser limit)

- **Add a New Coupon (Admin)**
  - **Endpoint:** `POST /api/coupons/admin/add`
  - **Description:** Adds a new coupon.
  - **Request Body:**
    ```json
    { "code": "COUPON_CODE" }
    ```
  - **Response:**
    - **Success:** `{ "message": "Coupon added" }`
    - **Error:** `500` – Error adding coupon

### Admin Endpoints

- **Admin Login**
  - **Endpoint:** `POST /api/admin/login`
  - **Description:** Authenticates the admin user and returns a JWT token.
  - **Request Body:**
    ```json
    {
      "username": "admin",
      "password": "admin123"
    }
    ```
  - **Response:**
    - **Success:** `{ "token": "<JWT_TOKEN>" }`
    - **Error:** `401` – Invalid credentials

- **View All Coupons (Protected)**
  - **Endpoint:** `GET /api/admin/coupons`
  - **Description:** Retrieves all coupons, including claim history.
  - **Headers:**  
    - `Authorization: Bearer <JWT_TOKEN>`
  - **Response:**  
    - **Success:** List of coupons in JSON format.

- **Update Coupon Details (Protected)**
  - **Endpoint:** `PUT /api/admin/coupon/update/:id`
  - **Description:** Updates coupon details such as status or coupon code.
  - **Headers:**  
    - `Authorization: Bearer <JWT_TOKEN>`
  - **Request Body:**
    ```json
    { "status": "available" }
    ```
  - **Response:**
    - **Success:** `{ "message": "Coupon updated successfully", "coupon": { ...updatedCoupon } }`
    - **Errors:**  
      - `404` – Coupon not found  
      - `500` – Error updating coupon

---

## Deployment

This backend can be deployed on platforms like [Render](https://render.com/). Ensure that you set the necessary environment variables (`MONGO_URI`, `JWT_SECRET`, etc.) in the deployment settings.

---

## Troubleshooting

- **Database Connection Issues:**  
  Ensure your `MONGO_URI` in the `.env` file is correct and that your MongoDB service is accessible.

- **JWT Issues:**  
  Verify that `JWT_SECRET` is set correctly and used consistently across login and token verification.

- **Abuse Prevention:**  
  Make sure your application uses the `cookie-parser` middleware and that your client (or Postman) accepts cookies.

---

## Repository Structure

```
coupon-app-backend/
│
├── models/
│   ├── Admin.js          # Admin schema and pre-save hook for password hashing
│   └── Coupon.js         # Coupon schema with fields for code, status, assignedTo, timestamp
│
├── routes/
│   ├── adminRoutes.js    # Admin-related endpoints (login, view/update coupons)
│   └── couponRoutes.js   # Public endpoints for coupon claiming and admin coupon addition
│
├── .env                  # Environment variables file (not committed to version control)
├── package.json          # Project metadata, dependencies, and scripts
└── server.js             # Main entry point, initializes Express, middleware, database connection, and routes
```

