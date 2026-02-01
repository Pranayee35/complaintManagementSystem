# Complaint Management System

A role-based Complaint Management System built using Next.js (App Router), NextAuth, Prisma, and PostgreSQL (Neon).
Designed for real-world usage, secure authentication, and scalable deployment.

# Features
 Role-Based Access Control

#Student

Register and log in

Submit complaints

Track complaint status

#Admin

View unclaimed complaints

Claim and resolve complaints

#Super Admin

View all complaints

Monitor system-wide statistics

Escalation oversight

# Tech Stack
Layer	Technology
Frontend	Next.js 14 (App Router)
Backend	Next.js Server Actions & API Routes
Authentication	NextAuth (Credentials Provider + JWT)
Database ORM	Prisma
Database	PostgreSQL (Neon Cloud)
Styling	Tailwind CSS
Deployment	Vercel

# Admin Signup Control (IMPORTANT)
ALLOW_ADMIN_SIGNUP Explained
Value	Behavior
true	Admin & Super Admin can register via signup page
false	Only STUDENT accounts can be created
