# 🎯 DariKita - Platform Donasi Mahasiswa UPNVJ

Platform donasi online khusus untuk mahasiswa UPNVJ dengan transparansi penuh dan integrasi payment gateway Midtrans.

## 🚀 Tech Stack

### Frontend

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (Vanilla JS)
- Font Awesome Icons

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- JWT Authentication
- Midtrans Payment Gateway

## 📁 Project Structure

```
darikita/
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── seeders/
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── js/
│   │   ├── api.js
│   │   ├── payment.js
│   │   └── app.js
│   └── assets/
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account
- Midtrans Sandbox account

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd darikita
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

### Step 3: Environment Variables

Create `.env` file in `backend/` directory:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://rizkyshakira2017_db_user:XkZSS0sK7tVMqup2@cluster0.amp26a8.mongodb.net/darikita?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=darikita_super_secret_key_2024_upnvj_donation_platform

MIDTRANS_SERVER_KEY=SB-Mid-server-XyAKRHuApu3Y4JnkFQqGNSek
MIDTRANS_CLIENT_KEY=SB-Mid-client-jvznO7_nOuRkV7yT
MIDTRANS_IS_PRODUCTION=false

FRONTEND_URL=http://localhost:3000
```

### Step 4: Seed Database

```bash
npm run seed
```

This will create:

- Test users (Admin, Auditor, Donatur)
- Sample causes (5 donation programs)

### Step 5: Start Backend Server

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 6: Frontend Setup

Open another terminal:

```bash
cd frontend
```

If you have Live Server (VS Code extension), right-click `index.html` and select "Open with Live Server".

Or use any static server:

```bash
# Using Python
python -m http.server 3000

# Using Node.js http-server
npx http-server -p 3000
```

Frontend will run on `http://localhost:3000`

## 🧪 Testing

### Test Accounts

**Admin**

- Email: `admin@darikita.com`
- Password: `admin123`

**Auditor**

- Email: `auditor@darikita.com`
- Password: `auditor123`

**Donatur**

- Email: `john@example.com`
- Password: `password123`

### Midtrans Test Cards

Use these test credit cards in Midtrans Sandbox:

**Success Transaction:**

- Card Number: `4811 1111 1111 1114`
- CVV: `123`
- Exp Date: `01/25`

**Failure Transaction:**

- Card Number: `4911 1111 1111 1113`
- CVV: `123`
- Exp Date: `01/25`

More test scenarios: [Midtrans Testing Guide](https://docs.midtrans.com/en/technical-reference/sandbox-test)

## 📱 Features

### Public Features

- ✅ View donation programs
- ✅ View transparency dashboard
- ✅ Public reports
- ✅ About page

### Donatur Features

- ✅ Register & Login
- ✅ Browse donation programs
- ✅ Make donations via Midtrans
- ✅ View donation history
- ✅ Download donation report
- ✅ Real-time payment status

### Admin Features

- ✅ Create/Edit/Delete causes
- ✅ Add program updates
- ✅ Manage donations
- ✅ Mark donations as distributed
- ✅ Upload distribution proof
- ✅ Generate reports

### Auditor Features

- ✅ View all donations
- ✅ Verify causes
- ✅ Verify donations
- ✅ Audit trail
- ✅ Generate audit reports

## 🔐 API Endpoints

### Authentication

```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/me           - Get current user (Protected)
PUT    /api/auth/profile      - Update profile (Protected)
```

### Causes

```
GET    /api/causes            - Get all causes
GET    /api/causes/:id        - Get single cause
POST   /api/causes            - Create cause (Admin)
PUT    /api/causes/:id        - Update cause (Admin)
DELETE /api/causes/:id        - Delete cause (Admin)
POST   /api/causes/:id/updates - Add update (Admin)
PUT    /api/causes/:id/verify  - Verify cause (Auditor)
```

### Donations

```
POST   /api/donations              - Create donation (Protected)
GET    /api/donations/my-donations - Get user donations (Protected)
GET    /api/donations              - Get all donations (Admin/Auditor)
GET    /api/donations/order/:id    - Get donation by order ID
POST   /api/donations/notification - Midtrans webhook
PUT    /api/donations/:id/distribute - Mark as distributed (Admin)
PUT    /api/donations/:id/verify    - Verify donation (Auditor)
```

## 🔄 Payment Flow

1. **User Initiates Donation**

   - Select cause and amount
   - Choose payment method
   - Submit donation form

2. **Backend Creates Transaction**

   - Generate unique order ID
   - Create donation record
   - Request Snap token from Midtrans

3. **Midtrans Payment Popup**

   - User completes payment
   - Midtrans processes transaction

4. **Webhook Notification**

   - Midtrans sends notification to backend
   - Backend updates donation status
   - Update cause raised amount

5. **User Redirect**
   - Success/Failed page
   - View updated dashboard

## 🚨 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**

```bash
# Check your MongoDB URI
# Ensure IP address is whitelisted in MongoDB Atlas
# Verify username and password
```

**Port Already in Use**

```bash
# Change PORT in .env file
# Or kill the process using the port
lsof -ti:5000 | xargs kill -9
```

### Frontend Issues

**API Connection Error**

```javascript
// Check API_BASE_URL in frontend/js/api.js
// Ensure backend is running
// Check CORS settings
```

**Payment Not Working**

```javascript
// Verify Midtrans client key
// Check browser console for errors
// Ensure snap.js is loaded
```

## 📊 Database Models

### User

- name, email, password
- role (donatur/admin/auditor)
- totalDonations, donationCount

### Cause

- title, category, description
- target, raised
- deadline, status
- updates array

### Donation

- donor, cause, amount
- paymentMethod, status
- orderId, snapToken
- isDistributed, isVerified

### Report

- title, period
- totalDonations, totalDistributed
- causes array, status

## 🔒 Security Notes

- JWT tokens expire in 30 days
- Passwords are hashed with bcrypt
- Midtrans webhook notifications are verified
- Role-based access control
- Input validation on all forms

## 📝 Development Notes

### Adding New Features

1. **Backend**: Create route → controller → update model
2. **Frontend**: Add API call in `api.js` → UI in `app.js`
3. **Test**: Use Postman for API → Manual test in browser

### Code Style

- Use async/await for promises
- Try-catch for error handling
- Descriptive variable names
- Comments for complex logic

## 🚀 Deployment

### Backend (Heroku/Railway/Render)

1. Create account and new project
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Frontend (Netlify/Vercel)

1. Update `API_BASE_URL` in `api.js`
2. Deploy static files
3. Configure redirects if needed

## 📞 Support

For issues or questions:

- Create GitHub issue
- Email: admin@darikita.com

## 📄 License

MIT License - feel free to use for educational purposes

## 👥 Team

- **Frontend Developer**: Ahmad Rizki Pratama
- **Backend Developer**: Sari Dewi Lestari
- **UI/UX Designer**: Budi Santoso

---

Made with ❤️ by DariKita Team - UPNVJ
# donasi-app-darikita
# darikita-donasi-app
# donasi-app-darikita
# darikita-donasi-app
