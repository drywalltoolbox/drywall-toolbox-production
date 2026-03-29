# Drywall Toolbox Theme

A professional, fully responsive coming-soon landing page WordPress theme for Drywall Toolbox.

## Features

- ✨ Full responsive design (mobile-first)
- 🎨 Dark theme with blue accents (#3b82f6)
- 📧 Email signup form with AJAX validation
- 🔗 Social media links
- ⚡ Optimized performance
- 🎯 Touch-friendly button sizes
- 🌙 High DPI screen support
- ♿ Accessibility focused

## Installation
--
1. Upload the theme folder to `/wp-content/themes/`
2. Go to Appearance > Themes in WordPress admin
3. Activate "Drywall Toolbox" theme

## Customization
-
### Logo
1. Go to Appearance > Customize
2. Click on "Site Identity"
3. Upload your logo

### Colors & Text
All customizable settings are in Appearance > Customize:

- **Hero Title**: Main heading ("COMING SOON")
- **Hero Tagline**: Subtitle text
- **Form Description**: Text above the email form
- **Form Button**: Button label
- **Social Title**: "Follow Us" text
- **Social Links**: Instagram, Facebook, Twitter URLs

### Email Signups
Submitted emails are stored in WordPress. To view:
1. Go to WordPress admin
2. Find the `drywall_toolbox_emails` option in the database (wp_options table)

To integrate with a mailing service:
1. Edit `functions.php`
2. Modify the `drywall_toolbox_email_signup()` function
3. Add your mailing service API integration

## File Structure

```
drywall-toolbox/
├── style.css              # Theme stylesheet with responsive design
├── functions.php          # Theme setup and functionality
├── header.php             # HTML head and page wrapper opening
├── footer.php             # Footer and page closing
├── front-page.php         # Homepage template
├── index.php              # Fallback template
├── js/
│   └── main.js            # Form handling and interactivity
└── assets/
    └── logo-white.svg     # Default logo (optional)
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Optimizations

- Minimal CSS (all in style.css)
- Inline SVG icons
- Font optimization with Google Fonts preconnect
- Hardware-accelerated animations
- Lazy loading support for images

## Mobile Responsiveness

The theme includes responsive breakpoints:
- **Mobile**: Base styles for 320px+
- **Tablet**: 768px and above
- **Desktop**: 1024px and above
- **Large Desktop**: 1440px and above
- **Landscape**: Special handling for mobile landscape

## Form Validation

- Client-side email validation via regex
- Server-side email validation via WordPress `is_email()`
- Nonce security for AJAX requests
- Error and success messages

## Security

- Nonce protection on AJAX endpoints
- Input sanitization (email inputs)
- Proper escaping of output
- CSRF protection via WordPress nonce system

## Support & License

GPL-2.0-or-later. See LICENSE file for details.

## Author

Drywall Toolbox
