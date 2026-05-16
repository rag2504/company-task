# 🏪 Provision Store - Billing & Stock Management System

A comprehensive web-based solution for managing retail operations, designed specifically for provision stores and small businesses. This full-stack application enables efficient stock management, billing operations, and revenue tracking with role-based access control.

## 🌟 Key Features

### 👥 **User Management & Authentication**
- **Owner Registration**: Secure signup process for store owners
- **Staff Management**: Owners can add and manage staff members
- **Role-Based Access**: Different permissions for owners and staff
- **Secure Login**: Email/password authentication with session management
- **Password Recovery**: Forgot password functionality

### 📦 **Advanced Stock Management**
- **Product Inventory**: Add, edit, and delete products with detailed information
- **Category Management**: Organize products across multiple categories:
  - Spices & Masalas, Rice/Dal/Grains, Bakery & Dairy
  - Snacks & Biscuits, Packaged Foods, Edible Oils & Ghee
  - Beverages, Personal Care, Household Items, and more
- **Stock Tracking**: Monitor units, weight, and pricing
- **Expiry Date Management**: Track product expiration dates
- **Low Stock Alerts**: Automatic notifications for inventory management
- **Expiry Notifications**: Alerts when products are nearing expiration

### 🧾 **Comprehensive Billing System**
- **Invoice Generation**: Create detailed bills for customers
- **Customer Management**: Store customer information and purchase history
- **Payment Tracking**: Multiple payment methods (Cash, Card, UPI, Credit)
- **Bill Status Management**: Track paid, pending, and partial payments
- **Print-Ready Bills**: Professional invoice formatting

### 📊 **Business Analytics & Reports**
- **Revenue Tracking**: Monitor daily, weekly, and monthly sales
- **Product Performance**: Track best-selling items
- **Customer Analytics**: View customer purchase patterns
- **Stock Reports**: Inventory levels and movement analysis
- **Financial Dashboard**: Real-time business metrics

### 🎨 **Modern User Experience**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Real-time Updates**: Live data synchronization
- **Intuitive Interface**: Easy-to-use design with modern UI components
- **Search & Filter**: Quick product and customer lookup

## 🛠️ Tech Stack

### **Frontend**
- **React.js 18.3.1** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Responsive Design** - Mobile-first approach

### **Backend**
- **Node.js** - Server runtime
- **Express.js 5.1.0** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 8.16.0** - MongoDB ODM

### **Deployment & DevOps**
- **Frontend**: Vercel (Production-ready deployment)
- **Backend**: Render (Cloud hosting)
- **Database**: MongoDB Atlas (Cloud database)
- **Version Control**: Git with GitHub

## 🚀 Quick Start

### Prerequisites
- Node.js (>= 18.0.0)
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/billing-stock-management.git
   cd billing-stock-management
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file with your MongoDB connection string
   echo "MONGODB_URI=your_mongodb_connection_string" > .env
   echo "PORT=5000" >> .env
   
   # Start the backend server
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../f
   npm install
   
   # Start the frontend development server
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🏗️ Project Structure

```
billing-stock-management/
├── backend/                    # Express.js API server
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables
├── f/                         # React frontend
│   ├── src/
│   │   ├── App.js            # Main application component
│   │   ├── SignIn.js         # Authentication components
│   │   ├── SignUp.js
│   │   ├── StaffManagement.js
│   │   └── utils/            # Utility functions
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── vercel.json               # Frontend deployment config
├── render.yaml               # Backend deployment config
└── README.md                 # Project documentation
```

## 🔧 API Endpoints

### **Products**
- `GET /api/products` - Retrieve all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### **Bills**
- `GET /api/bills` - Retrieve all bills
- `GET /api/bills/:id` - Get single bill
- `POST /api/bills` - Create new bill
- `PUT /api/bills/:id` - Update bill
- `DELETE /api/bills/:id` - Delete bill

### **Dashboard**
- `GET /api/dashboard/stats` - Get business statistics

## 👤 User Roles & Permissions

### **Owner Access**
- ✅ Full dashboard access
- ✅ Product management (CRUD operations)
- ✅ Staff management
- ✅ Billing operations
- ✅ Customer management
- ✅ Revenue reports
- ✅ Stock notifications

### **Staff Access**
- ✅ Dashboard viewing
- ✅ Billing operations
- ✅ Customer management
- ❌ Product management
- ❌ Staff management
- ❌ Revenue reports

## 🌐 Deployment

### **Frontend (Vercel)**
The frontend is configured for automatic deployment on Vercel:
```json
{
  "buildCommand": "cd f && npm install && npm run build",
  "outputDirectory": "f/build"
}
```

### **Backend (Render)**
The backend is deployed on Render with the following configuration:
```yaml
services:
  - type: web
    name: billing-stock-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
```

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px+)
- 💻 Tablets (768px+)
- 🖥️ Desktop computers (1024px+)

## 🔐 Security Features

- **Input Validation**: Comprehensive data validation
- **Secure Authentication**: Session-based user management
- **CORS Protection**: Configured for specific origins
- **Data Sanitization**: MongoDB injection protection
- **Role-Based Access**: Permission-based feature access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/billing-stock-management/issues)
- 📚 Documentation: [Wiki](https://github.com/your-username/billing-stock-management/wiki)

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB team for the robust database
- Vercel and Render for hosting services
- Lucide React for beautiful icons
- Tailwind CSS for the styling framework

---

**Made with ❤️ for small businesses and provision stores**

*Transform your retail operations with modern technology!*
