# Live Chat Widget Setup Guide

Integrate live chat functionality for real-time customer support. Choose from Intercom, Drift, or Zendesk.

## Option 1: Intercom (Recommended)

### 1. Sign Up
- https://intercom.com
- Create account (free tier: basic messaging, $39/mo for full features)

### 2. Get App ID
- Dashboard → Settings → Installation → Copy App ID

### 3. Install in React App

In `public/index.html`, add before `</head>`:
```html
<script>
  window.intercomSettings = {
    api_base: "https://api.intercom.io",
    app_id: "YOUR_APP_ID",
  };
</script>
<script async src="https://js.intercom-frames.com/abc"></script>
```

Or use npm package:
```bash
npm install react-intercom-messenger
```

Then in `src/App.tsx`:
```javascript
import IntercomMessenger from 'react-intercom-messenger';

function App() {
  return (
    <>
      <IntercomMessenger appId="YOUR_APP_ID" />
      {/* rest of app */}
    </>
  );
}
```

### 4. Set User Context

When user logs in, identify them:
```javascript
import { useIntercom } from 'react-intercom-messenger';

function Profile() {
  const { boot } = useIntercom();

  useEffect(() => {
    boot({
      userId: user.id,
      email: user.email,
      name: user.name,
      customAttributes: {
        applicationCount: user.applications.length,
        savedJobsCount: user.savedJobs.length,
      },
    });
  }, [user]);
}
```

### 5. Custom Messaging

Create automated message sequences:
- Dashboard → Messenger → Automations
- Trigger on page view, user action, or time delay

Examples:
- "Welcome!" message on first visit
- "Need help?" after 2 minutes of browsing
- "Job tips" after saving 3 jobs

## Option 2: Drift

### 1. Sign Up
- https://drift.com (~$50/mo minimum)

### 2. Get Code Snippet
- Settings → Install → Copy embed code

### 3. Add to `public/index.html`:
```html
<script>
  "use strict";

  !function() {
    var t = window.driftt = window.drift = window.drift || [], e = {}, n = [];
    function o(t) {
      var e = false;
      return function() {
        e || ((e = true), t.apply(this, arguments));
      };
    }
    t.load = o(function() {
      var t = createStylesheet = function(t) {
          var e = document.head || document.getElementsByTagName("head")[0], r = document.createElement("link");
          return r.async = !0, r.type = "text/css", r.rel = "stylesheet", r.href = t, e.appendChild(r), r;
        }, r = createScript = function(t) {
          var e = document.body || document.getElementsByTagName("body")[0], r = document.createElement("script");
          return r.async = !0, r.type = "text/javascript", r.src = t, e.appendChild(r), r;
        };
      createStylesheet("https://static.driftt.com/dist/drift.css");
      var i = createScript("https://static.driftt.com/dist/drift.js");
      i.onload = i.onreadystatechange = function() {
        if (!this.readyState || "loaded" !== this.readyState && "complete" !== this.readyState) return;
        drift.load("YOUR_DRIFT_EMBED_ID");
      };
    });
  }();
</script>
```

### 4. Configure

Dashboard → Settings:
- Set availability times (business hours)
- Create canned responses for common questions
- Set up bot responses for after-hours

## Option 3: Zendesk

### 1. Sign Up
- https://zendesk.com ($35+/mo)

### 2. Get Widget Code
- Admin → Channels → Widget → Copy installation code

### 3. Add to `public/index.html`:
```html
<script id="ze-snippet" src="https://static.zdassets.com/ekr/snippet.js?key=YOUR_KEY"></script>
```

## Common Features Across All Platforms

**Pre-Chat Form:**
- Collect name, email, topic before chat
- Better routing and context

**Canned Responses:**
- Common questions: "What's your hiring process?"
- Quick replies: "Thanks for reaching out!"

**Offline Messages:**
- When no agents available, collect contact info
- Send automated response

**Analytics:**
- Track chat volume, response time, satisfaction
- Monitor most common questions

## Recommendation

| Service | Price | Best For | Setup |
|---------|-------|----------|-------|
| **Intercom** | $39+/mo | Feature-rich, automations | Quick NPM install |
| **Drift** | $50+/mo | High-touch conversations | Embed snippet |
| **Zendesk** | $35+/mo | Full support platform | Integrated helpdesk |

Start with **Intercom free tier** to test, then upgrade if metrics show engagement.

## Testing

1. Install on staging environment
2. Test with different user types (job seeker, employer)
3. Monitor chat transcripts for quality
4. Refine bot responses based on common questions

## Next Steps

1. Choose platform and sign up
2. Get API credentials
3. Install widget in your React app
4. Set up auto-responses
5. Create help center articles
6. Train support team
