CAMPUSFIND — FRONT-END PROJECT
================================

TECHNOLOGIES
- HTML5
- CSS3
- Vanilla JavaScript
- Browser localStorage (no backend)

FILES
- index.html          Home page, search, category/status filters, item cards
- lost.html           Report a lost item
- found.html          Report a found item
- item-details.html   Item details and return status
- my-reports.html     Manage reports, update status, delete/reset reports
- css/style.css       Shared responsive styling
- js/storage.js       Demo data and localStorage functions
- js/app.js           Page interactions and rendering

IMPORTANT SETUP STEP
Each HTML page must load js/storage.js BEFORE js/app.js.
For simplicity, add this line immediately BEFORE the app.js script tag in ALL five HTML pages:

<script src="js/storage.js" defer></script>

Example:
<link rel="stylesheet" href="css/style.css">
<script src="js/storage.js" defer></script>
<script src="js/app.js" defer></script>

HOW TO RUN
1. Extract the CampusFind folder.
2. Add the storage.js script tag to all five HTML pages as shown above.
3. Open index.html in a modern browser.
4. Recommended: use Visual Studio Code with the Live Server extension, then right-click index.html and choose "Open with Live Server".

FEATURES
- Preloaded demo reports
- Search by title, description, category, and location
- Filter by category, status, and lost/found/returned type
- Add a lost or found report
- Optional item image upload (JPG, PNG, WEBP, maximum 2 MB)
- Persistent reports and status updates in localStorage
- Mark an item as returned
- My Reports: update status, delete reports, reset demo data
- Responsive layout for desktop and mobile

LIMITATIONS
- localStorage is stored in this browser profile on this device. Reports are NOT shared with other students or devices.
- Contact information is visible in this demo. Use fake/demo contact information for presentations.
- This is not a secure production service and has no login, ownership verification, moderation, or backend.
- Large photos may exceed localStorage capacity. If saving fails, try a smaller photo.
- Google Fonts is loaded from the internet; system fallback fonts will be used offline.
