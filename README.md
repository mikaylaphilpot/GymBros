# GymBros Application

## Description

The GymBros application is a fitness-focused web application developed using the MERN stack, with an additional Flutter mobile application in development. The purpose of the application is to allow users to create accounts, log in, and access fitness-related features.

The application includes user authentication, email verification, password reset functionality, and a notification system. The backend handles API requests, database operations, and communication between the web and mobile applications.

---

## Technologies Used

The application uses the MERN stack:

- **MongoDB** – Stores user accounts, notifications, and application data
- **Express.js** – Handles backend API routes and requests
- **React** – Provides the web application's user interface
- **Node.js** – Runs the backend server

Additional technologies include:

- **TypeScript** – Used for backend development
- **Flutter** – Used to develop the mobile application
- **JWT (JSON Web Tokens)** – Handles user authentication
- **Mailgun/SMTP** – Handles account verification and password reset emails
- **Firebase Cloud Messaging (FCM)** – Supports mobile push notifications
- **HTML, CSS, and JavaScript** – Used for frontend development

---

## High-Level Setup Instructions

1. Install Node.js, npm, and the necessary development tools.
2. Clone the GymBros GitHub repository.
3. Navigate to the `backend` directory and install the required dependencies using `npm install`.
4. Create a MongoDB database locally or through a remote database service.
5. Create a `backend/.env` file and configure the MongoDB connection string using `MONGODB_URI`.
6. Configure the necessary environment variables for JWT authentication and email services.
7. Navigate to the `frontend` directory and install the frontend dependencies using `npm install`.
8. Configure the frontend environment variables, including the backend API URL.
9. Start the backend server using `npm run dev` from the `backend` directory.
10. Start the frontend development server using `npm run dev` from the `frontend` directory.
11. Open the local frontend address in a web browser to access the application.

The backend can also be compiled using `npm run build` and started using `npm start`.

The Flutter mobile application has separate setup instructions available in [`mobile/README.md`](https://github.com/mikaylaphilpot/GymBros/blob/main/mobile/README.md).

---

## Running and Accessing the Application

Once MongoDB is connected and the frontend and backend servers are running, open a web browser and navigate to the application's local address.

The application allows users to create accounts, log in, and access available fitness-related features.

The backend authentication API runs locally at `http://localhost:5001/api/auth`, while the frontend development server typically runs at `http://localhost:5173`.

The application uses JWT authentication to manage user sessions and protect endpoints that require users to be logged in.

A notification system is also available for testing browser notifications and supporting mobile notifications. The Flutter application is being developed as an additional client that communicates with the same backend API.

---

## Assumptions, Limitations, and AI Usage

### Assumptions

- Node.js and npm are installed on the development machine.
- A local or remote MongoDB database is available.
- The user has basic familiarity with JavaScript, TypeScript, React, and Node.js.
- The necessary frontend and backend dependencies have been installed.
- The application's environment variables and database credentials have been configured correctly.
- The frontend and backend servers are running and can communicate with each other.
- Email verification and notification features require additional third-party service configuration.

### Limitations

- Push notifications require additional configuration, including browser permissions or Firebase Cloud Messaging for mobile devices.
- Some notification features currently rely on development testing endpoints and are not intended for production use.
- The application requires a working MongoDB connection to store and retrieve user information.
- Certain features are still being developed and may not be fully integrated across the frontend, backend, and mobile application.

### AI Usage
This project was developed with assistance from generative AI tools:

- **Tool**: Copilot
- **Dates**: Nov 4-11
- **Scope**: Set up the initial flutter project and translated my APIs into the mobile project
- **Use**: Set up the mobile project using Copilot to debug an issues with set up as well as generate the dart files for the log in, sign up, and edit schedule functions using the typescript code as reference

- **Tool**: Copilot
- **Dates**: Nov 6-15
- **Scope**: API implementation for login, signup, and friends
- **Use**: Used Copilot to help implement and connect the frontend API requests with backend routes for account registration and login, and for searching, adding, listing, and removing friends. 

- **Tool**: ChatGPT
- **Dates**: Nov 7-13
- **Scope**: API implementation for home, profile, forgot password
- **Use**: Used ChatGPT to help implement the APIs needed to load user information onto the profile and home pages, set up password reset functionality, store and display user and bro workouts, and set up notifications to "bug" other users.

- **Tool**: 
- **Dates**: 
- **Scope**: 
- **Use**:

- **Tool**: 
- **Dates**: 
- **Scope**: 
- **Use**:

- **Tool**: 
- **Dates**: 
- **Scope**: 
- **Use**:

All AI-generated code was reviewed, tested, and modified to meet
assignment requirements. Final implementation reflects my understanding
of the concepts.
