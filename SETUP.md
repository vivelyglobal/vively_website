# VIVELY CAMPAIGNS - SETUP GUIDE

## Prerequisites
- Node.js v14+ (you have v22 ✓)
- Git (you have it ✓)
- MongoDB (choose one below)

## OPTION A: MongoDB Atlas (Cloud) - RECOMMENDED

### 1. Create Free MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free
3. Create a new project "vively"
4. Create a cluster (M0 free tier)
5. Create database user:
   - Username: `vively_user`
   - Password: (generate secure password)
6. Get connection string:
   - Click "Connect" → "Drivers"
   - Copy connection string
   - Replace `<username>`, `<password>`, `<database>`

### 2. Update .env.local
Replace `MONGODB_URI` with your connection string:
```
MONGODB_URI=mongodb+srv://vively_user:YOUR_PASSWORD@cluster.mongodb.net/vively_campaigns?retryWrites=true&w=majority
```

## OPTION B: MongoDB Local (for development only)

### 1. Install MongoDB Community Edition
```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify:
mongosh --version
```

### 2. Set .env.local
```
MONGODB_URI=mongodb://localhost:27017/vively_campaigns
```

## Setup Instructions

### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Verify Environment
```bash
# Check .env.local is set up correctly
cat .env.local
```

### 3. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:8888
# Functions at /.netlify/functions/*
```

### 4. Seed Demo Data
Open browser and visit:
```
http://localhost:8888/.netlify/functions/seed
```

You should get:
```json
{
  "message": "Demo data seeded successfully",
  "admin": {
    "email": "admin@vively.com",
    "password": "admin123"
  }
}
```

### 5. Test Pages
- Campaigns Listing: http://localhost:8888/campaigns.html
- Campaign Detail: http://localhost:8888/campaign-detail.html?id=<campaign_id>
- Admin Panel: http://localhost:8888/admin.html
  - Email: admin@vively.com
  - Password: admin123

## Environment Variables

### Development (.env.local)
```
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=dev-secret-key-change-in-production
ADMIN_EMAIL=admin@vively.com
SITE_URL=http://localhost:8888
```

### Production (Set in Netlify UI)
Same as above, but with:
- `MONGODB_URI` = Production MongoDB connection
- `JWT_SECRET` = Strong random key
- `SITE_URL` = Your production domain

## Database Schema

### Collections
- `campaigns` - Campaign listings
- `users` - Admin/creator accounts
- `applications` - Campaign applications

### Campaign Fields
```javascript
{
  _id: ObjectId,
  title: string,
  brand: string,
  category: string,
  description: string,
  imageUrl: string,
  location: string,
  budget: string,
  spots: number,
  deadline: string,
  platform: string,
  isActive: boolean,
  applicantCount: number,
  createdAt: Date,
  updatedAt: Date,
  // ... more fields
}
```

## API Endpoints

### Public
- `GET /.netlify/functions/campaigns` - List campaigns (with filters)
- `POST /.netlify/functions/applications` - Submit application

### Admin (requires auth token)
- `GET /.netlify/functions/admin-campaigns` - List all campaigns
- `GET /.netlify/functions/admin-campaigns/:id` - Get campaign
- `POST /.netlify/functions/admin-campaigns` - Create campaign
- `PUT /.netlify/functions/admin-campaigns/:id` - Update campaign
- `DELETE /.netlify/functions/admin-campaigns/:id` - Delete campaign

### Auth
- `POST /.netlify/functions/auth-login` - Login/Register
- `POST /.netlify/functions/seed` - Seed demo data

## Troubleshooting

### "Cannot connect to MongoDB"
- Check MongoDB is running (if local): `brew services list`
- Check MONGODB_URI in .env.local
- Check MongoDB connection string format

### "Functions not found"
- Make sure `netlify dev` is running
- Check `/netlify/functions` folder exists
- Restart: `Ctrl+C` and run `npm run dev` again

### "CORS errors"
- Netlify dev automatically handles CORS
- If deploying, Netlify Functions handle it

## Deployment to Netlify

### 1. Push to GitHub
```bash
git add .
git commit -m "Add campaigns marketplace"
git push origin main
```

### 2. Connect to Netlify
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select your GitHub repo
4. Set environment variables in Netlify UI:
   - `MONGODB_URI` = Production MongoDB
   - `JWT_SECRET` = Strong random key
5. Deploy!

### 3. Access Live
- Main site: `https://your-site.netlify.app`
- Admin: `https://your-site.netlify.app/admin.html`
- Campaigns: `https://your-site.netlify.app/campaigns.html`

## Next Steps

1. ✓ Setup .env.local
2. ✓ Install Netlify CLI
3. ✓ Start `npm run dev`
4. ✓ Seed demo data
5. Test campaigns page
6. Login to admin and create campaigns
7. Deploy to Netlify

---
Questions? Check the code in:
- Backend: `/netlify/functions/`
- Frontend: `/assets/js/`
- Pages: `campaigns.html`, `campaign-detail.html`, `admin.html`
