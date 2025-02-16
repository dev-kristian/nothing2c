# Kino & Chill

### A Movie & TV Show Watchlist and Recommendation Platform

**Kino & Chill** is an interactive movie and TV show platform that lets users explore, manage curated watchlists, vote on Movie Night polls, and create shared experiences with friends! Built with modern web development tools, it leverages Firebase for authentication, Firestore for real-time data management, and TMDb API for media information.

## Screenshots
### Explore Movies Section
![Media Explore Section](./public/screenshot.png)

## Features

1. **Explore & Search**
   - Browse trending movies and TV shows.
   - Search for specific titles or actors.
   - Use filters to find top-rated and popular media.
  
2. **Top Watchlists**
   - View the top-rated movies and TV shows in the community based on a weighted ranking system (`vote_average` and `watchlist_count`).
   - Explore watchlists specifically for movies or TV shows.

3. **Personal Watchlist**
   - Add or remove items from your personal watchlist.
   - Movies or TV shows added to the watchlist are updated both locally and in the global Firestore collection.

4. **Movie Night Sessions**
   - Create or join movie night sessions with friends.
   - Set up voting polls to decide what to watch.
   - View ongoing sessions, track votes, and see the best-timed availability of friends.
   
5. **Google Authentication & Account Management**
   - Sign in with Google or create an account with a username & password.
   - Store personal preferences and watchlist data securely in Firebase.

6. **Real-time Synchronization**
   - Real-time updates of sessions including voting and watchlist changes using Firestore listeners.
   - Receive push notifications for important updates like movie poll results.

7. **User Notifications & Subscription Management**
   - Enable push notifications for live updates for new sessions or trending releases.

## Tech Stack

**Frontend:**
- **Next.js**: React framework with server-side rendering, dynamic routing, and file-based routing.
- **React**: Core UI framework.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Framer Motion**: Animation library for UI interactions.
- **Radix UI**: Accessible and customizable React components for UI elements like tabs, tooltips, dialogs, etc.
  
**Backend**
- **Firebase**: Firebase Authentication, Firestore (NoSQL database), Firebase Cloud Messaging.
- **TMDb API**: Fetch movie & TV show data for displaying details, posters, and ratings.

## Installation & Setup

### Prerequisites:

- **Node.js** (v16.x.x or higher)
- **Firebase Project** with Firestore Database set up
- **TMDb API Key**: You will need to [register and create an API Key](https://www.themoviedb.org/signup) on TMDb to fetch movie and TV data.

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/kinonchill.git
   cd kinonchill
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a new file `.env.local` at the root of the project or use the `.env.local.example` and just remove `.example`. Add the following environment variables, replacing the placeholders with your actual keys and settings:

   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

   NEXT_PRIVATE_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PRIVATE_FIREBASE_CLIENT_EMAIL=your_client_email
   NEXT_PRIVATE_FIREBASE_PRIVATE_KEY=your_firebase_private_key
   NEXT_PRIVATE_TMDB_API_KEY=your_tmdb_api_key
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_firebase_cloud_messaging_vapid_key
   CRON_SECRET=cron_secret_for_vercel_cron_jobs
   # Ensure characters like "\n" in private keys are correctly formatted
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

5. (Optional) Build for production:

   ```bash
   npm run build
   ```


## Firebase Setup

1. Set up Firebase by following the [Firebase Setup Documentation](https://firebase.google.com/docs/web/setup).
2. Add Firestore and Authentication (Google Sign-In and Email-Pass setup).
3. Make sure Firestore rules allow reads/writes for authenticated users.

### Firestore Structure Example

Here’s an example of the Firestore database structure for `watchlist` and `sessions` collections:

```
Firestore Database structure:

users (Collection)
│
├── userId (Document)
    ├── username: string
    ├── email: string
    └── watchlist (SubDocument)
          ├── movie: { <id>: true, <id2>: true, ... }
          └── tv: { <id>: true, <id2>: true, ... }

sessions (Collection)
│
├── sessionId (Document)
    ├── createdAt: timestamp
    ├── createdBy: string
    ├── userDates: { <username>: [{date: Timestamp, hours: [...]}], ... }
    ├── poll: { id: string, movieTitles: [...], votes: { <username>: [...] } }
    └── status: 'active' | 'closed'
```

Ensure the proper security rules are set for Firestore, allowing users to only modify their own watchlist or session data.

## Testing & Linting

For linting, you can run:

```bash
npx eslint .
```

Tests can be added with Jest or other testing libraries for better coverage.

## Contributing

We welcome contributions! To contribute:

1. Fork this repository.
2. Create a branch: `git checkout -b feature/my-feature`.
3. Make your changes and commit: `git commit -m 'Add my feature'`.
4. Push to your branch: `git push origin feature/my-feature`.
5. Open a pull request for review.

Please adhere to the pre-established code style and conventions where possible.

## 🌟 Made with ❤️

**Kino & Chill** was crafted with care and passion by dev-kristian who loves both movies and great user experiences. 🎬🍿

I believe in the power of cinema and bringing people together for shared moments, whether it's exploring new films, hosting movie nights, or building a community of cinephiles! If you enjoyed using this platform or have ideas on how to make it even better, please feel free to contribute, suggest, or simply say hi! 😄

Let's make every movie night unforgettable! 🌙🎥

---

If you enjoyed this project, feel free to give it a ⭐ on GitHub! Thank you for your support!

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more information.

---

Feel free to open an issue or discuss new ideas to improve Kino & Chill!

