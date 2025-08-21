### Redmine Jira Theme

Redmine Jira Theme is a Redmine plugin that provides a Jira-like responsive UI theme with support for both dark and light modes.
It modernizes Redmine’s look & feel while keeping all the core functionality intact.

## ✨ Features
- 🎨 Jira-inspired design for Redmine.
- 🌙 Dark & Light theme switcher (admin-controlled).
- 📱 Responsive design for mobile and tablets.
- 📂 Per-page CSS overrides for fine-tuned styling.
- 🧭 Sidebar toggle (expand/collapse with smooth animation).
- 🔄 Full-width content view when sidebar is hidden (nosidebar mode).
- ⚡ Modern JavaScript enhancements for usability.

## 📂 Installation

1. Navigate to your Redmine plugins directory:

```bash
cd /path/to/redmine/plugins
```

2. Clone or copy this plugin:

```bash
git clone https://github.com/your-org/redmine_jira_theme.git
```

3. Restart your Redmine server:

```bash
# for Passenger/Unicorn/Puma
touch /path/to/redmine/tmp/restart.txt
```

or restart with:
```bash
bundle exec rails server
```

## ⚙️ Configuration

- Go to Administration → Plugins and locate Jira Theme.
- Admins can:
  - Switch between dark and light themes.
  - Enable/disable sidebar toggle.
  - Apply mobile responsive layout.

## 📸 Screenshots

(Add screenshots of Light mode, Dark mode, Sidebar toggle, Mobile view here)

## 🛠 Development

CSS overrides are located in:
```bash
assets/stylesheets/
```

JavaScript enhancements are located in:
```bash
assets/javascripts/
```

You can override styles per page by using file-specific CSS (e.g., issues.css, projects.css).

## 🚀 Compatibility
- Redmine 4.x, 5.x
- Ruby 2.7+ / 3.x
- Tested with PostgreSQL & MySQL setups

## 🤝 Contributing

Pull requests and feature suggestions are welcome!
Please fork the repo and submit a PR with clean, tested changes.

## 📜 License

This project is licensed under the MIT License.
See the LICENSE file for details.

## 🙌 Credits
Built with ❤️ by sivamanikandan.

👉 With this README, your plugin will look professional and developer-friendly.