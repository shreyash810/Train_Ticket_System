# 🚆 Train Ticket Reservation System (Rail IN)

A comprehensive web-based application for managing train ticket reservations, passenger profiles, and customer complaints. This full-stack project features a secure Admin portal, a dedicated Staff dashboard for resolving issues, and a user-friendly Passenger interface for booking and managing trips.

## 🌟 Features

### 👤 Passenger Module
* **User Registration & Login:** Secure account creation with email and password.
* **Search Trains:** Find trains by Origin, Destination, and Travel Date.
* **Book Tickets:** Select coach types (Sleeper, AC) and book seats.
* **My Reservations:** View upcoming and past trips with status (Confirmed/Cancelled).
* **Cancel Booking:** Cancel upcoming reservations.
* **Complaint Management:** Register complaints regarding services and track their status.
* **Profile Management:** Update personal details.

### 🛡️ Admin Module
* **Dashboard:** Overview of total reservations, trains, and complaints.
* **Manage Trains:** Add new trains to the schedule.
* **Search Reservations:** Advanced search filters to find bookings by Passenger Name, Train No, or Date.
* **Complaint Assignment:** Assign passenger complaints to specific Staff members (e.g., Cleaning or Billing department).

### 👷 Staff Module
* **Staff Dashboard:** View complaints specifically assigned to the logged-in staff member.
* **Resolve Issues:** Update complaint status (In Progress, Resolved, Closed).

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** Angular 16+
* **Architecture:** Standalone Components (No Modules)
* **Styling:** CSS3, Responsive Design
* **State Management:** Angular Signals

### Backend
* **Framework:** Spring Boot 3.x
* **Language:** Java 17+
* **Database:** MySQL
* **ORM:** Hibernate / Spring Data JPA
* **Security:** Custom Token-based Authentication

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v18+) & npm
* Java Development Kit (JDK 17+)
* MySQL Server
* Maven

### 1. Backend Setup (Spring Boot)
1.  Navigate to the `Backend` folder.
2.  Open `src/main/resources/application.yml` and configure your MySQL database credentials:
    ```yaml
    spring:
      datasource:
        url: jdbc:mysql://localhost:3306/train_db
        username: root
        password: your_password
    ```
3.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```
4.  The server will start at `http://localhost:8080`.
    * *Note: The app includes a `DataLoader` that automatically seeds default Admin, Staff, and Passenger data on the first run.*

### 2. Frontend Setup (Angular)
1.  Navigate to the `Frontend` folder.
    ```bash
    cd Frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    ng serve
    ```
4.  Open your browser and navigate to `http://localhost:4200`.

---

## 🔑 Default Credentials

The system comes pre-loaded with the following users for testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@rail.in` | `Admin@123` |
| **Staff (Ramesh)** | `ramesh@rail.in` | `Ramesh@123` |
| **Staff (Anita)** | `anita@rail.in` | `Anita@123` |
| **Passenger** | `amit.patil@example.com` | `Amit@123` |

---

## 📸 Screenshots

### Home Page
<img width="1908" height="1074" alt="Screenshot 2026-01-29 163956" src="https://github.com/user-attachments/assets/757eb8cf-4b45-47f8-b100-0760414b8e1a" />


### Admin Dashboard
<img width="1600" height="831" alt="admin_dashboard" src="https://github.com/user-attachments/assets/eaff175c-8cb9-4eeb-be9f-1a941b484190" />


### Staff Complaint View
<img width="1600" height="798" alt="staff_dashboard" src="https://github.com/user-attachments/assets/9977b7f7-afa5-4069-a6a7-9d71b67f5392" />

---

## 📡 API Endpoints

The backend exposes RESTful APIs for all operations. Key endpoints include:

* **Auth:** `/api/auth/login`, `/api/auth/register`
* **Trains:** `/api/trains/search`, `/api/trains/add`
* **Reservations:** `/api/bookings`, `/api/reservations/my`
* **Complaints:** `/api/complaints/register`, `/api/admin/assign-complaint`

---

## 🤝 Contribution

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature-name`).
3.  Commit your changes (`git commit -m 'Add new feature'`).
4.  Push to the branch (`git push origin feature-name`).
5.  Open a Pull Request.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

