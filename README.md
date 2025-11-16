# CampusEase - Campus Management System

CampusEase is a comprehensive campus management system designed to streamline various aspects of campus life for students, faculty, and staff.

## Features

### 1. User Management
- Multi-role signup system (students, faculty, staff)
- Profile management with customizable settings
- Authentication using Supabase

### 2. Academic Management
- Course management and tracking
- Schedule planning and organization
- Library resource management
- Academic event tracking

### 3. Problem Reporting & Tracking
- Issue reporting system
- Problem tracking and status updates
- ML-based priority assignment
- Report analytics and insights

### 4. Lost & Found System
- Report lost items
- List found items
- Claim system with verification
- Real-time updates and notifications

### 5. Community Features
- Event management (Academic, Career, Social)
- Emergency alerts system
- Community discussions
- Resource sharing

### 6. Analytics & Reports
- Data analysis dashboard
- Report generation
- Recruitment tracking
- Performance metrics

## Technology Stack

- **Frontend**:
  - React with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - shadcn/ui for UI components

- **Backend**:
  - Supabase for database and authentication
  - Flask for ML services
  - Python for data processing

- **Machine Learning**:
  - scikit-learn for priority prediction
  - Pandas for data processing
  - NumPy for numerical operations

## Getting Started

1. **Clone the repository**
```sh
git clone <repository-url>
cd campus-ease
```

2. **Install dependencies**
```sh
# Install Node.js dependencies
npm install

# Install Python dependencies for ML services
pip install pandas numpy scikit-learn joblib supabase flask flask_cors
```

3. **Environment Setup**
- Create a `.env` file with your Supabase credentials
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start the development servers**
```sh
# Start the frontend
npm run dev

# Start the ML service (in another terminal)
python app.py
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Main application pages
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── services/      # API and service integrations
└── supabase/      # Supabase client and types
```

## Key Pages

- `/` - Home page
- `/login` - User authentication
- `/signup` - User registration
- `/profile` - User profile management
- `/courses` - Course management
- `/schedule` - Schedule planning
- `/resources` - Resource management
- `/lost-found` - Lost and Found system
- `/problems` - Problem reporting
- `/events` - Event management
- `/data-analysis` - Analytics dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
