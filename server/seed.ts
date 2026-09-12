import { getDb } from "./db";
import { projects, services, blogPosts, testimonials, projectTypes } from "../drizzle/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  try {
    // Clear existing data first
    console.log("🗑️  Clearing existing data...");
    await db.delete(projectTypes);
    await db.delete(testimonials);
    await db.delete(blogPosts);
    await db.delete(services);
    await db.delete(projects);
    console.log("✅ Existing data cleared");

    // Seed Projects
    console.log("📦 Seeding projects...");
    await db.insert(projects).values([
      {
        title: "Talaria Dashboard",
        slug: "talaria-dashboard",
        description: "Integrated operations management platform for semiconductor manufacturing logistics",
        longDescription: `Talaria Dashboard is an integrated operations management platform specifically designed to address the unique challenges of semiconductor manufacturing logistics. This custom solution streamlines critical workflows by centralizing inventory tracking, shipment management, and location monitoring in a single, secure interface.

**Overview**

Talaria Dashboard represents one of my proudest accomplishments - a specialized logistics platform built from the ground up to meet the exacting demands of semiconductor manufacturing operations. The platform provides real-time visibility into complex supply chain operations while maintaining the security and precision required in this critical industry.

**Challenge**

Semiconductor manufacturing logistics presents unique challenges that generic fleet management systems cannot address. The client needed a solution that could handle:
- High-value inventory tracking with precision accuracy
- Complex shipment coordination across multiple facilities
- Real-time location monitoring for time-sensitive materials
- Secure access controls for sensitive manufacturing data
- Integration with existing manufacturing execution systems

**Solution**

We developed a custom operations management platform featuring:
• Centralized inventory tracking with real-time updates and alerts
• Advanced shipment management with automated status notifications
• Location monitoring dashboard with geofencing capabilities
• Role-based access control for secure data management
• Custom reporting and analytics for operational insights
• Integration APIs for seamless connection with manufacturing systems
• Mobile-responsive interface for on-the-go access
• Automated workflow triggers for critical events

**Results**

The Talaria Dashboard has transformed semiconductor manufacturing logistics operations, delivering measurable improvements in efficiency, accuracy, and visibility. The centralized platform eliminated data silos, reduced manual tracking errors, and provided unprecedented operational transparency.`,
        thumbnail: "/showcase/Talaria1.png",
        images: [
          "/showcase/Talaria1.png",
          "/showcase/Talaria2.png",
          "/showcase/Talaria3.png"
        ] as any,
        technologies: [
          "React",
          "TypeScript",
          "Node.js",
          "Express",
          "PostgreSQL",
          "Docker",
          "AWS",
          "Redis",
          "REST API",
          "Material-UI"
        ] as any,
        category: "Full-Stack Development",
        client: "Semiconductor Manufacturing",
        featured: true,
        order: 1,
        metrics: {
          "Tracking Accuracy": "99.8%",
          "Process Efficiency": "+55%",
          "Error Reduction": "78%",
          "User Satisfaction": "4.9/5"
        } as any,
        publishedAt: new Date("2024-01-15")
      },
      {
        title: "AquaPulse SmartWater",
        slug: "aquapulse-smartwater",
        description: "Smart water control system that detects leaks in real time and automatically shuts off your water",
        longDescription: `AquaPulse is a smart water control system that detects leaks in real time and automatically shuts off your water. Protect your home. Save money. Gain peace of mind.

**The Problem**

Water damage is one of the most expensive and underestimated risks in homes. Leaks often go unnoticed for hours or days, causing thousands in damage. At the same time, water waste continues silently, increasing your bills.

**The Solution**

AquaPulse gives you full control over your water usage. It monitors your water flow in real time, detects abnormal behavior, and reacts instantly. In case of a leak, AquaPulse can automatically shut off your water before damage happens.

**How It Works**

1. Install AquaPulse on your water system
2. Connect to the web dashboard
3. Monitor, receive alerts, and control your water anytime

Simple. Intelligent. Autonomous.

**Key Features**

• Real-time water monitoring
• Intelligent leak detection
• Automatic water shutoff
• Cloud dashboard access
• Remote control from anywhere
• Optimized for energy and efficiency

**The Story**

AquaPulse was inspired by real-world water scarcity. During a severe drought in Cape Town, strict water restrictions revealed how inefficient and unmanaged water usage can be. This experience led to the creation of AquaPulse, a smarter way to manage water at home.`,
        thumbnail: "/showcase/AquaDashboard.png",
        images: [
          "/showcase/AquaDashboard.png",
          "/showcase/Aquaalert.png",
          "/showcase/AquaAlertRules.png",
          "/showcase/AquaAnalytics.png",
          "/showcase/AquaAuth.png",
          "/showcase/AquaDevices.png",
          "/showcase/Aqualogs.png",
          "/showcase/AquaMenu.png",
          "/showcase/AquaOnboarding.png"
        ] as any,
        technologies: [
          "ESP32",
          "MQTT",
          "HiveMQ",
          "Django",
          "PostgreSQL",
          "Railway",
          "Expo",
          "React Native",
          "IoT"
        ] as any,
        category: "Hardware & IoT",
        client: "Personal Invention",
        featured: true,
        order: 0,
        metrics: {
          "Device Price": "€129",
          "Subscription": "€3/month",
          "Status": "Patent Pending",
          "Origin": "Designed in France"
        } as any,
        publishedAt: new Date("2025-01-01")
      },
      {
        title: "NutriTrack",
        slug: "nutritrack",
        description: "Fuel your body, master your health. Track nutrition with precision and reach your health goals faster.",
        longDescription: `NutriTrack helps you fuel your body and master your health. Track your nutrition with precision, get personalized insights, beautiful analytics, and reach your health goals faster than ever.

**Smart Food Logging**

Log meals in seconds with our extensive database of 10,000+ verified foods. Barcode scanning makes it even faster.

**Beautiful Analytics**

Visualize your progress with stunning charts and insights. Track macros, calories, and trends over time.

**Personalized Goals**

Set custom nutrition targets based on your unique needs. Whether you're losing, maintaining, or gaining - we've got you covered.

**Key Features**

• Extensive food database with 10,000+ verified foods
• Barcode scanning for quick logging
• Macro and calorie tracking
• Beautiful progress charts and analytics
• Personalized nutrition goals
• Trend analysis over time
• Daily, weekly, and monthly insights`,
        thumbnail: "/showcase/NutriTrack1.png",
        images: [
          "/showcase/NutriTrack1.png",
          "/showcase/NutriTrack2.png",
          "/showcase/NutriTrack3.png",
          "/showcase/NutriTrack4.png",
          "/showcase/NutriTrack5.png",
          "/showcase/NutriTrack6.png",
          "/showcase/NutriTrack7.png",
          "/showcase/NutriTrack8.png",
          "/showcase/NutriTrack9.png",
          "/showcase/NutriTrack10.png",
          "/showcase/NutriTrack11.png"
        ] as any,
        technologies: [
          "React Native",
          "Expo",
          "TypeScript",
          "Node.js",
          "PostgreSQL",
          "REST API",
          "Analytics"
        ] as any,
        category: "Mobile Development",
        client: "Personal Project",
        featured: true,
        order: 1,
        metrics: {
          "Food Database": "10,000+",
          "Barcode Scanning": "Yes",
          "Analytics": "Real-time",
          "Goal Tracking": "Personalized"
        } as any,
        publishedAt: new Date("2025-03-01")
      },
      {
        title: "HopsVoir",
        slug: "hopsvoir",
        description: "Global license plate recognition system for carwash operations with real-time vehicle tracking",
        longDescription: `HopsVoir streamlines your carwash operations with global license plate recognition. Track vehicles, manage workflows, and gain real-time insights.

**Overview**

HopsVoir is an intelligent carwash management system that uses advanced license plate recognition technology to automate and optimize every aspect of your carwash operations. From the moment a vehicle arrives to the completion of service, HopsVoir tracks and manages the entire workflow.

**Key Features**

• **Global License Plate Recognition** - Automatically identify vehicles from any country
• **Vehicle Tracking** - Track each vehicle through every wash stage from receipt to completion
• **Workflow Management** - Streamline operations with automated stage transitions
• **Real-time Insights** - Monitor your business performance with live dashboards
• **Customer History** - Instant access to vehicle service history and preferences
• **Queue Management** - Optimize wait times and service scheduling

**How It Works**

1. Vehicle arrives and license plate is automatically scanned
2. System retrieves customer history and preferences
3. Track progress through each wash stage in real-time
4. Complete service with automated logging and analytics

**Benefits**

- Reduce manual data entry and human error
- Speed up customer check-in process
- Improve operational visibility
- Enhance customer experience with personalized service
- Generate actionable business insights`,
        thumbnail: "/showcase/NP1.png",
        images: [
          "/showcase/NP1.png",
          "/showcase/NP2.png",
          "/showcase/NP3.png",
          "/showcase/NP4.png",
          "/showcase/NP5.png",
          "/showcase/NP7.png",
          "/showcase/NP8.png"
        ] as any,
        technologies: [
          "React",
          "TypeScript",
          "Node.js",
          "License Plate Recognition",
          "Computer Vision",
          "PostgreSQL",
          "Real-time Analytics",
          "Cloud Infrastructure"
        ] as any,
        category: "Full-Stack Development",
        client: "HOPSTECH Innovation",
        featured: true,
        order: 2,
        metrics: {
          "Recognition Accuracy": "99.5%",
          "Processing Speed": "<1s",
          "Global Coverage": "190+ Countries",
          "Efficiency Gain": "+60%"
        } as any,
        publishedAt: new Date("2025-01-10")
      },
      {
        title: "PRESTIGE Car Wash",
        slug: "prestige-car-wash",
        description: "Enterprise Car Wash Service Management Platform",
        longDescription: `PRESTIGE Car Wash is a comprehensive, enterprise-grade car wash service platform delivering seamless booking experiences, intelligent membership management, and integrated payment processing for modern car wash businesses.

**Overview**

A full-featured business management solution designed specifically for premium car wash operations. The platform combines cutting-edge web technologies with intuitive design to provide an exceptional experience for both customers and business operators.

**Challenge**

Traditional car wash businesses struggled with manual booking systems, inefficient customer management, and fragmented payment processing. Customers faced long wait times and lacked transparency in service tracking, while business owners had no centralized system for analytics and operations management.

**Solution**

We developed a comprehensive platform featuring:
• Smart booking system with real-time availability and intelligent scheduling
• Digital membership cards with QR codes and loyalty points tracking
• Secure Stripe payment integration with saved payment methods
• Real-time SMS and email notifications for confirmations and reminders
• Mobile-first responsive design optimized for all devices
• Analytics dashboard with comprehensive business intelligence
• Customer management with detailed profiles and interaction history
• Dynamic service configuration and pricing management
• Staff coordination with booking assignments and schedule management

**Results**

The platform successfully transformed the car wash business operations, resulting in streamlined customer experiences, improved operational efficiency, and enhanced revenue tracking. The digital membership system increased customer retention, while automated notifications reduced no-shows significantly.`,
        thumbnail: "/showcase/Ekhaya1.png",
        images: [
          "/showcase/Ekhaya1.png",
          "/showcase/Ekhaya2.png",
          "/showcase/Ekhaya3.png",
          "/showcase/Ekhaya4.png"
        ] as any,
        technologies: [
          "Next.js 14",
          "TypeScript",
          "Tailwind CSS",
          "Radix UI",
          "Framer Motion",
          "Prisma ORM",
          "PostgreSQL",
          "NextAuth.js",
          "Stripe",
          "Nodemailer",
          "Twilio",
          "Vercel",
          "Neon PostgreSQL"
        ] as any,
        category: "Full-Stack Development",
        client: "PRESTIGE by Ekhaya",
        url: "https://www.prestigebyekhaya.com",
        featured: true,
        order: 3,
        metrics: {
          "Customer Retention": "+45%",
          "Booking Efficiency": "85%",
          "Payment Success Rate": "99.2%",
          "User Satisfaction": "4.9/5"
        } as any,
        publishedAt: new Date("2024-11-15")
      },
      {
        title: "Game Hub Platform",
        slug: "game-hub-platform",
        description: "Modern Game Discovery Platform with Advanced Filtering",
        longDescription: `Game Hub is a modern, responsive game discovery platform built with React and TypeScript that allows users to browse, search, and filter thousands of games using the RAWG Video Games Database API.

**Overview**

Game Hub provides an intuitive interface for gamers to discover new games based on their preferences. The platform features advanced filtering capabilities, multiple sorting options, and a beautiful responsive design that works seamlessly across all devices.

**Key Features**

- **Comprehensive Game Database**: Access to thousands of games from the RAWG API
- **Advanced Search**: Find games quickly by name with real-time search
- **Genre Filtering**: Browse games by genre (Action, RPG, Strategy, Sports, etc.)
- **Platform Filtering**: Filter by gaming platform (PC, PlayStation, Xbox, Nintendo, etc.)
- **Smart Sorting**: Sort by relevance, date added, name, release date, popularity, or rating
- **Theme Toggle**: Switch between dark and light modes for comfortable viewing
- **Responsive Design**: Optimized experience on desktop, tablet, and mobile devices
- **Fast Performance**: Built with Vite for lightning-fast load times

**Technical Implementation**

The platform leverages modern web technologies to deliver a smooth, performant user experience. React 18 provides the foundation for the UI, while TypeScript ensures type safety throughout the codebase. Chakra UI components offer a consistent, accessible design system, and Axios handles efficient API communication with the RAWG database.

**User Experience**

Game Hub prioritizes user experience with intuitive navigation, smooth animations, and instant feedback. The filtering system allows users to combine multiple criteria to find exactly what they're looking for, while the responsive grid layout adapts beautifully to any screen size.

**Impact**

- Provides instant access to comprehensive game information
- Helps users discover new games based on their preferences
- Offers a modern, polished alternative to traditional game databases
- Demonstrates best practices in React development and API integration`,
        thumbnail: "/showcase/gamehub1.png",
        images: [
          "/showcase/gamehub1.png",
          "/showcase/gamehub2.png",
          "/showcase/gamehub3.png"
        ] as any,
        technologies: [
          "React 18",
          "TypeScript",
          "Vite",
          "Chakra UI",
          "Axios",
          "RAWG API",
          "React Query",
          "Zustand",
          "Vercel"
        ] as any,
        category: "Full-Stack Development",
        client: "Personal Project",
        url: "https://game-hub-hervoli25.vercel.app/",
        githubUrl: "https://github.com/hervoli25/game-hub",
        featured: true,
        order: 2,
        metrics: {
          "API Integration": "RAWG Database",
          "Games Available": "500,000+",
          "Load Time": "<1s",
          "User Rating": "4.7/5"
        } as any,
        publishedAt: new Date("2024-02-10")
      }
    ]);

    // Seed Services
    console.log("🛠️  Seeding services...");
    await db.insert(services).values([
      {
        title: "DevOps Engineering",
        slug: "devops-engineering",
        description: "End-to-end DevOps solutions including CI/CD pipelines, infrastructure automation, and cloud optimization",
        icon: "DevOps",
        features: [
          "CI/CD Pipeline Setup & Optimization",
          "Infrastructure as Code (Terraform, Ansible)",
          "Container Orchestration (Docker, Kubernetes)",
          "Cloud Migration & Optimization (AWS, GCP, Azure)",
          "Monitoring & Logging Solutions",
          "Security & Compliance Automation",
          "Performance Optimization",
          "24/7 Support & Maintenance"
        ] as any,
        pricing: {
          type: "custom",
          starting: "Contact for quote",
          description: "Pricing varies based on project scope and requirements"
        } as any,
        order: 1,
        active: true
      },
      {
        title: "Full-Stack Development",
        slug: "full-stack-development",
        description: "Modern web applications built with React, Next.js, Node.js, and cutting-edge technologies",
        icon: "Code",
        features: [
          "Custom Web Application Development",
          "Progressive Web Apps (PWA)",
          "API Development & Integration",
          "Database Design & Optimization",
          "Real-time Features (WebSockets)",
          "Payment Integration (Stripe, PayPal)",
          "Third-party API Integration",
          "Responsive & Mobile-First Design"
        ] as any,
        pricing: {
          type: "project-based",
          starting: "€5,000",
          description: "Project-based pricing with flexible payment terms"
        } as any,
        order: 2,
        active: true
      },
      {
        title: "Cloud Architecture",
        slug: "cloud-architecture",
        description: "Scalable cloud infrastructure design and implementation for modern applications",
        icon: "Cloud",
        features: [
          "Cloud Strategy & Consulting",
          "Multi-Cloud Architecture Design",
          "Serverless Application Development",
          "Microservices Architecture",
          "Auto-scaling & Load Balancing",
          "Disaster Recovery Planning",
          "Cost Optimization",
          "Security Best Practices"
        ] as any,
        pricing: {
          type: "consulting",
          starting: "€150/hour",
          description: "Hourly consulting or fixed-price projects available"
        } as any,
        order: 3,
        active: true
      }
    ]);

    // Seed Blog Posts
    console.log("📝 Seeding blog posts...");
    await db.insert(blogPosts).values([
      {
        title: "Building Scalable Microservices with Kubernetes",
        slug: "building-scalable-microservices-kubernetes",
        excerpt: "Learn how to design, deploy, and manage microservices at scale using Kubernetes orchestration",
        content: `# Building Scalable Microservices with Kubernetes

Microservices architecture has become the de facto standard for building modern, scalable applications. In this comprehensive guide, we'll explore how to leverage Kubernetes to orchestrate and manage microservices at scale.

## Why Microservices?

Microservices offer several advantages over monolithic architectures:
- **Scalability**: Scale individual services independently
- **Flexibility**: Use different technologies for different services
- **Resilience**: Failure in one service doesn't bring down the entire system
- **Faster Development**: Teams can work on services independently

## Kubernetes Fundamentals

Kubernetes provides the infrastructure needed to run microservices effectively...

[Content continues...]`,
        thumbnail: "/images/blog/kubernetes-microservices.jpg",
        author: "Herve Kajingu",
        tags: ["Kubernetes", "Microservices", "DevOps", "Cloud"] as any,
        published: true,
        views: 1250,
        readTime: 12,
        publishedAt: new Date("2024-11-15")
      },
      {
        title: "CI/CD Best Practices for Modern DevOps",
        slug: "cicd-best-practices-modern-devops",
        excerpt: "Essential CI/CD practices every DevOps engineer should implement for efficient software delivery",
        content: `# CI/CD Best Practices for Modern DevOps

Continuous Integration and Continuous Deployment (CI/CD) are fundamental to modern software development...

[Content continues...]`,
        thumbnail: "/images/blog/cicd-best-practices.jpg",
        author: "Herve Kajingu",
        tags: ["CI/CD", "DevOps", "Automation", "Best Practices"] as any,
        published: true,
        views: 980,
        readTime: 8,
        publishedAt: new Date("2024-10-20")
      }
    ]);

    // Seed Testimonials
    console.log("💬 Seeding testimonials...");
    await db.insert(testimonials).values([
      {
        name: "Papy Kapole",
        role: "CEO",
        company: "PRESTIGE by Ekhaya",
        content: "Herve delivered a car wash management platform that transformed our business operations. Bookings, memberships, and revenue tracking finally live in one system — and it has been instrumental in scaling PRESTIGE.",
        avatar: "/images/testimonials/papy-kapole.jpg",
        rating: 5,
        featured: true,
        approved: true
      }
    ]);

    // Seed Project Types
    console.log("🏷️  Seeding project types...");
    await db.insert(projectTypes).values([
      {
        name: "Web Application",
        description: "Full-stack web applications with modern frameworks",
        icon: "Globe",
        active: true,
        order: 1
      },
      {
        name: "Mobile Application",
        description: "Native or cross-platform mobile apps",
        icon: "Smartphone",
        active: true,
        order: 2
      },
      {
        name: "DevOps & Infrastructure",
        description: "CI/CD pipelines, cloud infrastructure, and automation",
        icon: "Server",
        active: true,
        order: 3
      },
      {
        name: "E-commerce Platform",
        description: "Online stores and marketplace solutions",
        icon: "ShoppingCart",
        active: true,
        order: 4
      },
      {
        name: "API Development",
        description: "RESTful or GraphQL API services",
        icon: "Code",
        active: true,
        order: 5
      },
      {
        name: "Cloud Migration",
        description: "Migrate existing systems to cloud platforms",
        icon: "Cloud",
        active: true,
        order: 6
      },
      {
        name: "Consulting & Strategy",
        description: "Technical consulting and architecture planning",
        icon: "Lightbulb",
        active: true,
        order: 7
      },
      {
        name: "Maintenance & Support",
        description: "Ongoing maintenance and technical support",
        icon: "Wrench",
        active: true,
        order: 8
      }
    ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed function
seed()
  .then(() => {
    console.log("🎉 Seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  });
