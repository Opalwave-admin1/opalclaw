# The Complete NanoClaw + Claude Setup Guide for Mac

_For Absolute Beginners on MacBook_

---

## Who This Guide Is For

> You just got a MacBook. You've maybe opened Terminal once by accident and closed it in terror. You want to run AI on your computer but every tutorial assumes you already know things you don't. This guide is for you.

We’re going to build everything from scratch. No prior knowledge required. No "just run this command" without explaining what it does. No mysterious errors with no explanation.

By the end of this guide, you'll have:

- ✅ NanoClaw running on your Mac (web interface)
- ✅ Claude API connected and working
- ✅ Your own private AI setup that runs in the cloud but controlled from your Mac

Let's do this.

---

## ⚠️ Prerequisites — What You Need Before Starting

Before we begin, make sure you have:

### Required

- ✅ **A MacBook** (M1, M2, M3 chip — most Macs from 2020+) OR Intel Mac with 8GB+ RAM
- ✅ **Internet connection** (for connecting to Claude API)
- ✅ **Admin access** (ability to enter your Mac password when installing software)
- ✅ **At least 10GB free disk space** (for Node.js and Homebrew)
- ✅ **Claude API Token** — Get one at [console.anthropic.com](https://console.anthropic.com) (requires account creation)

### Recommended (Not Required)

- 📝 **A notepad** to write down your versions as you go
- ☕ **Patience** — First-time setup takes 15-30 minutes

### What You'll Install (All Free)

- **Homebrew** — Package manager for Mac
- **Node.js** — JavaScript runtime
- **Git** — Version control
- **NanoClaw** — Web interface for Claude

### Time Required

- **First time setup:** 15–30 minutes
- **After setup:** 10 seconds to start each time

### What NOT to worry about

- ❌ No credit card needed to start (API tokens have free credits)
- ❌ No complex model management
- ❌ No VPS required (unless you want 24/7 + Slack/Discord/WhatsApp)
- ❌ No prior coding experience needed

---

## 📑 Table of Contents

- [Who This Guide Is For](about:blank#who-this-guide-is-for)
- [Prerequisites](about:blank#prerequisites--what-you-need-before-starting)
- [Section 1: Terminal Basics](about:blank#section-1-meet-your-new-best-friend--terminal)
- [Section 2: Installing Homebrew](about:blank#section-2-installing-homebrew--the-app-store-for-command-line)
- [Section 3: Installing Node.js](about:blank#section-3-installing-nodejs--your-javascript-engine)
- [Section 4: Installing Git](about:blank#section-4-installing-git--the-version-control-system)
- [Section 5: Getting Your Claude API Token](about:blank#section-5-getting-your-claude-api-token)
- [Section 6: Installing NanoClaw](about:blank#section-6-installing-nanoclaw--connecting-to-claude)
- [Section 7: Configuration](about:blank#section-7-essential-configuration--making-life-easier)
- [Section 8: Testing Your Setup](about:blank#section-8-testing-your-complete-setup)
- [Section 9: Tips & Tricks](about:blank#section-9-tips-tricks-and-pro-advice)
- [Section 10: Common Mistakes](about:blank#section-10-common-beginner-mistakes-dont-do-this)
- [Section 11: Cheat Sheet](about:blank#section-11-your-complete-cheat-sheet)
- [Section 12: Mac Sleep/Shutdown](about:blank#section-12-what-happens-when-mac-sleeps-or-shuts-down)
- [Section 13: Slack, WhatsApp, Discord](about:blank#section-13-connecting-claude-to-slack-whatsapp-and-discord)
- [Section 14: What's Next?](about:blank#section-14-whats-next)

---

## Section 1: Meet Your New Best Friend — Terminal

### What is Terminal?

Think of Terminal as a text-based remote control for your Mac. Instead of clicking buttons with your mouse, you type commands. It sounds scary, but it's actually incredibly powerful — and once you get used to it, you'll feel like a wizard.

### Opening Terminal for the First Time

1. Click the **Spotlight Search** icon (the magnifying glass in the top-right of your screen) or press **Command + Space**
2. Type "Terminal"
3. Press **Enter**

You should see a window that looks like a weird black box with text in it. That's Terminal!

> 💡 **PRO TIP:** Pin Terminal to your Dock! Right-click the Terminal icon in the Dock → Options → Keep in Dock. You'll be opening this a lot.

### Understanding the Terminal Window

Let's break down what you're looking at:

```
user@MacBook ~ %
```

- **user** — Your username
- **@MacBook** — Your computer's name
- **~** — This means you're in your home folder (your personal directory)
- **%** — This is the prompt, waiting for you to type something

### Your First Command — Say Hello

Type this and press Enter:

```
echo "Hello, World!"
```

You just made your computer print text! See? Not so scary.

### The Most Important Command — Getting Help

```
help
```

This shows you available commands. You'll use this more than you'd expect.

### Navigating Your Mac with Terminal

Let's learn to move around:

```
pwd
```

This stands for "Print Working Directory" — it shows you exactly where you are.

Now let's see what's in your current folder:

```
ls
```

This lists all files and folders in your current location.

Want to see hidden files (files that start with a dot, like .bashrc)? Use:

```
ls -la
```

### Moving Around (Changing Directories)

To go into a folder, use `cd` (change directory):

```
cd Documents
```

To go back to the previous folder:

```
cd ..
```

To go back to your home folder from anywhere:

```
cd ~
```

Or just:

```
cd
```

---

### 📋 TODO: Terminal Basics

- [ ] Open Terminal
- [ ] Type `pwd` and press Enter
- [ ] Type `ls` and press Enter
- [ ] Type `cd Documents` then `ls`
- [ ] Type `cd ..` to go back
- [ ] Type `cd` to return home

---

## Section 2: Installing Homebrew — The App Store for Command Line

### What is Homebrew?

Homebrew is a free package manager for Mac. Think of it like an App Store, but for developer tools and command-line programs. It makes installing things incredibly easy.

### Checking If You Already Have Homebrew

Let's see if Homebrew is installed:

```
brew --version
```

If it says something like "Homebrew 4.x.x", you're good! Skip to the next section.

If it says "command not found" or gives an error, we need to install it.

### Installing Homebrew

Just copy and paste this command into Terminal:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/brew_install.sh)"
```

**What this does:**

- `bin/bash` — Runs the bash shell
- `c` — Run the following command string
- `curl -fsSL` — Downloads a file from the internet (f=follow redirects, s=silent, S=show errors, L=follow location)
- The URL — Gets the Homebrew installation script

### What Happens During Installation

1. The script will download and run
2. It might ask for your password (your Mac login password)
3. It might ask "Press RETURN to continue or any other key to abort" — press **Return**
4. It will install Xcode Command Line Tools (don't worry, this is just some basic developer tools)

### Verifying Homebrew Installation

After it finishes, run:

```
brew --version
```

You should see something like "Homebrew 4.2.0" or similar.

> 💡 **TIP:** If you get a permission error, you might need to run:
>
> ```
> sudo chown -R $(whoami) /usr/local/homebrew
> ```
>
> (This takes ownership of the Homebrew directory. You'll need to enter your password.)

### Updating Homebrew

Always good to have the latest version:

```
brew update
```

### Installing Your First Package — Just for Practice

Let's install a simple package to make sure everything works:

```
brew install wget
```

This installs wget — a tool for downloading files from the internet.

Test it:

```
wget --version
```

---

### 📋 TODO: Homebrew

- [ ] Check if Homebrew is installed
- [ ] If not, install Homebrew
- [ ] Verify with `brew --version`
- [ ] Run `brew update`
- [ ] Install wget as a test

---

## Section 3: Installing Node.js — Your JavaScript Engine

### What is Node.js?

Node.js is a JavaScript runtime that lets you run JavaScript outside of a web browser. It's essential for running many AI tools and applications.

When people say "install Node," they mean Node.js.

### Checking If You Already Have Node

```
node --version
```

If it shows a version (like v20.x.x or v18.x.x), you're set!

If it says "command not found," let's install it.

### Installing Node.js via Homebrew

This is the easy way:

```
brew install node
```

This will take a minute or two. It downloads and installs Node and npm (Node Package Manager).

### Verifying Node.js Installation

After installation:

```
node --version
npm --version
```

You should see version numbers for both. Great!

### Understanding npm

npm stands for "Node Package Manager." It's a huge library of pre-made code you can download and use. Think of it like an App Store for code.

We'll use npm to install NanoClaw later.

> 💡 **TIP:** Node versions change frequently. It's okay to have an older version, but if you want to be current, check nodejs.org for the latest LTS (Long Term Support) version.

---

### 📋 TODO: Node.js

- [ ] Check if Node is installed (`node --version`)
- [ ] If not, install with `brew install node`
- [ ] Verify npm works (`npm --version`)
- [ ] Write down your Node and npm versions somewhere

---

## Section 4: Installing Git — The Version Control System

### What is Git?

Git is a version control system — a way to track changes to your files and collaborate with others. It's essential for downloading (cloning) code from GitHub, which is where NanoClaw lives.

### Checking If Git Is Already Installed

```
git --version
```

If it shows a version, you're good!

### Installing Git on Mac

Actually, Git is usually pre-installed on Mac. But if it's not:

```
brew install git
```

### Configuring Git (Important!)

Before using Git, let's set up your identity. This adds your name and email to your commits:

```
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Replace "Your Name" with your actual name and "your@email.com" with your email.

> **Why do this?** When you download code or make changes, Git needs to know who you are. It's like signing your work.

### Checking Your Git Configuration

```
git config --list
```

This shows all your Git settings. You should see your name and email there.

---

### 📋 TODO: Git

- [ ] Check Git version (`git --version`)
- [ ] Install Git if needed
- [ ] Configure your name and email
- [ ] Verify with `git config --list`

---

## Section 5: Getting Your Claude API Token

### What is the Claude API?

The Claude API lets you connect to Claude through code. Instead of using the web interface at claude.ai, you can send messages programmatically and get responses back.

**Why use the API?**

- 🔒 **Privacy** — Your conversations are API-based, not stored in browser
- 🎛 **Customizable** — Control exactly how Claude responds
- 💰 **Free credits** — New accounts get free credits to try
- 🔗 **Integrations** — Connect to Slack, WhatsApp, Discord, and more

### Creating a Claude Account

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Click "Sign Up" or "Create Account"
3. Enter your email and create a password
4. Verify your email (check your inbox)
5. Complete any verification steps

### Getting Your API Token

1. Once logged in to the Anthropic Console, look for **"API Keys"** in the sidebar
2. Click **"Create Key"** or **"Generate Key"**
3. Give it a name (like "NanoClaw" or "My Mac")
4. Copy the key immediately — **it will only be shown once!**

> ⚠️ **CRITICAL:** Save this key somewhere safe! You'll need it for NanoClaw. If you lose it, you'll need to create a new one.

### Understanding Your Free Credits

- New accounts typically receive **$5-25 in free credits**
- These credits don't expire
- You can add more credits anytime
- API usage is pay-per-use after free credits

### Keeping Your Token Safe

Never share your API key! Treat it like a password.

- ❌ Don't post it online
- ❌ Don't share it with others
- ✅ Keep it in a password manager
- ✅ Only enter it in NanoClaw (local)

---

### 📋 TODO: Claude API Token

- [ ] Create account at console.anthropic.com
- [ ] Navigate to API Keys
- [ ] Create a new API key
- [ ] Copy and save the key securely
- [ ] Verify you can see your free credits

---

## Section 6: Installing NanoClaw — Connecting to Claude

### What is NanoClaw?

NanoClaw is a tool that connects to the Claude API and provides a web interface (GUI) to interact with Claude. Think of it as a nicer, easier-to-use chat interface compared to the terminal.

### What Does NanoClaw Do?

- Provides a beautiful web interface
- Lets you manage multiple conversations
- Connects to Claude API (cloud-based AI)
- Makes AI accessible without using command line

### Prerequisites Check

Before installing NanoClaw, make sure:

- ✅ You have your Claude API token (from Section 5)
- ✅ Node.js is working (`node --version`)
- ✅ npm is working (`npm --version`)

### Installing NanoClaw

There are a few ways to install NanoClaw. The most common is via npm:

```
npm install -g nanoclaw
```

**What this does:**

- `npm` — The Node Package Manager
- `install` — Install a package
- `-g` — Install globally (so you can run it from anywhere)
- `nanoclaw` — The package name

### Starting NanoClaw

Once installed, you'll need to set up your API key. There are two ways:

**Option 1: Environment Variable (Recommended)**

Set your API key as an environment variable. Add this to your shell config (see Section 7):

```
export ANTHROPIC_API_KEY="your-api-key-here"
```

Replace `your-api-key-here` with your actual API key.

**Option 2: Command Line Flag**

You can also pass it when starting NanoClaw:

```
nanoclaw --api-key "your-api-key-here"
```

### Starting NanoClaw

Once your API key is set:

```
nanoclaw
```

This starts the web server. You should see something like:

```
🚀 NanoClaw is running at http://localhost:8080
```

### Accessing the NanoClaw Interface

1. Open your web browser (Chrome, Safari, etc.)
2. Go to: `http://localhost:8080`

You should see the NanoClaw interface! You can now chat with Claude through a nice web page.

> ⚠️ **IMPORTANT:** Keep the terminal window with NanoClaw running open. If you close it, the web interface stops working.

---

### 📋 TODO: NanoClaw

- [ ] Check prerequisites (Node, npm)
- [ ] Install NanoClaw (`npm install -g nanoclaw`)
- [ ] Set your API key as environment variable
- [ ] Start NanoClaw
- [ ] Open http://localhost:8080 in browser
- [ ] Send a message to Claude
- [ ] Take a screenshot to celebrate! 📸

---

### Troubleshooting NanoClaw

**Issue: "command not found" after installation**

```
export PATH="$PATH:$(npm root -g)/bin"
```

Add this to your shell config (see Section 7).

**Issue: Invalid API key**

Make sure your API key is correct. Check for extra spaces or characters.

**Issue: Can't connect to Claude**

- Check your internet connection
- Verify your API key is correct
- Make sure you have free credits left

**Issue: Port already in use**

Something else might be using port 8080. You can change the port:

```
nanoclaw --port 3000
```

Then go to `http://localhost:3000`

---

## Section 7: Essential Configuration — Making Life Easier

### Understanding Shell Configuration

When you open Terminal, it runs a "shell" — a program that interprets your commands. The default shell on Mac is called "zsh" (Z shell).

You can configure your shell to make life easier. This involves editing files that run every time you open Terminal.

### Finding Your Shell Config File

```
ls -la ~ | grep .zsh
```

You should see `.zshrc` — this is your shell configuration file.

### Editing Your .zshrc File

Open it with a text editor:

```
nano ~/.zshrc
```

This opens the nano text editor with your config file.

### Adding Your API Key

Add this line to your .zshrc (press Ctrl+O to save, then Ctrl+X to exit):

```
export ANTHROPIC_API_KEY="your-api-key-here"
```

Replace `your-api-key-here` with your actual Claude API key.

After saving, reload your config:

```
source ~/.zshrc
```

### Adding Useful Aliases

Add these lines to your .zshrc:

```
# NanoClaw shortcuts
alias nc='nanoclaw'
alias nc8080='nanoclaw --port 8080'

# Navigation shortcuts
alias home='cd ~'
alias desk='cd ~/Desktop'

# Git shortcuts
alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
```

After saving, reload your config:

```
source ~/.zshrc
```

Now you can use these short commands!

### Setting Up PATH for npm Global Packages

If NanoClaw doesn't work after installing, add this to your .zshrc:

```
export PATH="$PATH:$(npm root -g)/bin"
```

Save and reload with `source ~/.zshrc`

### Customizing Your Terminal Prompt

Want a cooler-looking terminal? Add this to your .zshrc:

```
PS1="%F{green}%n@%m%f:%F{blue}%~%f$ "
```

This gives you a colored prompt: username@computername:folder$

> 💡 **TIP:** There are many zsh themes available. Check out "Oh My Zsh" at https://ohmyz.sh for easy theming.

---

### 📋 TODO: Configuration

- [ ] Open your .zshrc file
- [ ] Add your Claude API key
- [ ] Add useful aliases
- [ ] Add npm to PATH if needed
- [ ] Reload your config
- [ ] Test your new shortcuts

---

## Section 8: Testing Your Complete Setup

### The Big Test — Everything Working Together

Let's verify everything works end-to-end:

**Step 1: Start NanoClaw**

```
nanoclaw
```

(Keep this terminal open!)

**Step 2: Open Your Browser**

Go to http://localhost:8080

**Step 3: Send a Test Message**

Type something like: "Hello! What can you help me with?"

**Step 4: Verify Response**

You should get a response from Claude!

### Alternative Test — Using Claude Directly

If you want to test your API key works without NanoClaw:

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Look for "Playground" or "API Explorer"
3. Try sending a message

If this works, your API key is valid and credits are available.

---

### 📋 TODO: Complete Setup Test

- [ ] Start NanoClaw
- [ ] Open browser interface
- [ ] Have a conversation with Claude
- [ ] Test API in Playground too

---

### Troubleshooting Common Issues

| Problem                    | Solution                               |
| -------------------------- | -------------------------------------- |
| NanoClaw won't start       | Check your API key is set correctly    |
| API key invalid            | Verify key in console.anthropic.com    |
| No credits left            | Check your billing section             |
| "Command not found" errors | Add npm to PATH (see Section 7)        |
| Terminal is slow           | Check your .zshrc for too many plugins |

### Checking Your Credits

Run this to check API usage:

```
# In the Anthropic Console
# Look for "Billing" or "Usage" in the sidebar
```

Or visit [console.anthropic.com](https://console.anthropic.com) and check your dashboard.

> 💡 **CREDITS TIP:** Free credits typically last months with normal usage. If you run out, you can add a payment method for pay-as-you-go.

---

## Section 9: Tips, Tricks, and Pro Advice

### Productivity Tips

**Tab Completion**

Press **Tab** to auto-complete commands, file names, and folder names. This saves tons of time!

**Command History**

Press **Up Arrow** to reuse the previous command. Press it multiple times to go back further.

**Clear Screen**

Type `clear` to clean up your terminal.

**Kill a Running Process**

Press **Ctrl + C** to stop whatever is running.

---

### Useful Keyboard Shortcuts

| Shortcut | Action                 |
| -------- | ---------------------- |
| Cmd + K  | Clear terminal         |
| Cmd + T  | New tab                |
| Cmd + W  | Close tab              |
| Cmd + Q  | Quit Terminal          |
| Ctrl + C | Cancel current command |
| Ctrl + L | Clear current line     |
| Tab      | Auto-complete          |

### Running Multiple Terminals

Pro tip: Use Terminal windows effectively:

- **Window 1:** NanoClaw (running the web interface)
- **Window 2:** General commands

### Saving Your Setup

If you want to back up your configuration:

1. Copy your .zshrc: `cp ~/.zshrc ~/.zshrc.backup`
2. Note your API key location (if using a password manager)

### Keeping NanoClaw Running in Background

If you don't want to keep a terminal open, you can use a process manager:

```
# Using a simple approach - run in background with nohup
nohup nanoclaw > nanoclaw.log 2>&1 &
```

This runs NanoClaw in the background. You'll need to manually stop it:

```
pkill nanoclaw
```

### Checking System Resources

Open a new terminal and run:

```
top
```

This shows:

- CPU usage
- Memory usage
- Running processes

Press **Q** to quit.

### Updating Everything

Keep your tools up to date:

```
# Update Homebrew
brew update

# Upgrade packages
brew upgrade

# Update npm packages
npm update -g
```

---

## Section 10: Common Beginner Mistakes (Don't Do This!)

### ❌ Mistake #1: Closing the NanoClaw Terminal

**Problem:** You close the terminal running `nanoclaw` and then wonder why nothing works.

**Solution:** Keep that terminal open, or run NanoClaw as a background service (see Section 9).

### ❌ Mistake #2: Installing Things Without Understanding

**Problem:** You run commands from tutorials without knowing what they do.

**Solution:** Read the output! Terminal tells you what's happening. If you don't understand, Google it.

### ❌ Mistake #3: Not Checking Version Numbers

**Problem:** You have an old version with bugs.

**Solution:** Check versions regularly: `node --version`, `npm --version`, `git --version`

### ❌ Mistake #4: Ignoring Error Messages

**Problem:** Something fails and you ignore it.

**Solution:** Read the error! It usually tells you exactly what's wrong. Error messages are your friend.

### ❌ Mistake #5: Installing Multiple Versions of Node

**Problem:** You use different Node versions for different projects and get confused.

**Solution:** Use `nvm` (Node Version Manager) to manage multiple versions. Search for "nvm install node" if you need this later.

### ❌ Mistake #6: Exposing Your API Key

**Problem:** You share your API key or post it online.

**Solution:** Keep it private! If you accidentally share it, create a new key and delete the old one.

---

## Section 11: Your Complete Cheat Sheet

### Essential Commands Reference

**NAVIGATION**

```
pwd              Where am I?
ls               List files
ls -la           List all files (including hidden)
cd <folder>      Go into folder
cd ..            Go back
cd ~             Go home
cd               Go home
```

**TERMINAL**

```
clear            Clear screen
Ctrl+C           Cancel/stop
Ctrl+L           Clear line
Tab              Auto-complete
Up/Down          Command history
```

**HOMEBREW**

```
brew --version   Check Homebrew
brew update      Update Homebrew
brew install X   Install X
brew list        Show installed
```

**NODE/NPM**

```
node --version   Check Node
npm --version    Check npm
npm install -g X Install X globally
```

**GIT**

```
git --version    Check Git
git config --list Show config
git clone <url>  Download repo
```

**NANOCLAW**

```
nanoclaw         Start web interface
nanoclaw --port 3000 Use port 3000
nanoclaw --api-key XXX Use specific API key
```

---

### Quick Start Checklist

Every time you want to use your AI setup:

1. Open Terminal
2. Run: `nanoclaw` (keep open)
3. Open browser → http://localhost:8080
4. Chat with Claude!
5. Close terminal when done

---

## Section 12: What Happens When Mac Sleeps or Shuts Down?

### Will NanoClaw Keep Running?

**No.** When your Mac goes to sleep or shuts down, all running processes stop — including NanoClaw.

Here's what you need to know:

**When your Mac sleeps:**

- NanoClaw stops running
- You need to restart it when you wake up

**When you shut down:**

- Everything closes completely
- You'll need to start fresh next time

### Starting NanoClaw After Sleep/Wake

Every time you wake your Mac or turn it on:

1. Open Terminal
2. Start NanoClaw: `nanoclaw`
3. Go to http://localhost:8080

That's it! It takes about 10 seconds total.

### Option: Keep NanoClaw Running 24/7

If you want NanoClaw to always be running (like a server):

```
# Run in background
nohup nanoclaw > nanoclaw.log 2>&1 &
```

This runs NanoClaw as a background service.

> ⚠️ **NOTE:** Your Mac will still sleep normally. The service will attempt to restart when it wakes up, but there might be a brief delay before it's ready.

### Better Option: Use a VPS (Optional)

If you want your AI running 24/7 without your Mac being on, you need a VPS (Virtual Private Server). This is a computer in the cloud that runs 24/7.

**When to consider a VPS:**

- You want AI accessible even when your Mac is off
- You want to connect to Slack, WhatsApp, or Discord bots
- You need constant uptime

**How to set up on a VPS:**

1. Get a VPS (DigitalOcean, Linode, AWS, etc.)
2. Install Ubuntu (free Linux OS)
3. Install Node.js and NanoClaw
4. Your AI runs in the cloud, not on your Mac

> 💡 **TIP:** For beginners, start with local setup on your Mac. Upgrade to VPS only when you need 24/7 access or want to build integrations with Slack/Discord.

---

## Section 13: Connecting Claude to Slack, WhatsApp, and Discord

### Why Connect to These Platforms?

Instead of opening a browser to chat with Claude, you can talk to it through:

- **Slack** — Team communication
- **Discord** — Community chat
- **WhatsApp** — Personal messaging

This turns Claude into a bot that responds in real-time!

> ⚠️ **REQUIREMENT:** To connect to Slack, WhatsApp, or Discord, you need either:
>
> - **Option A:** Your Mac running NanoClaw 24/7 (keep Mac on)
> - **Option B:** A VPS with NanoClaw running 24/7

### Option A: NanoClaw Built-in Integrations

NanoClaw may have built-in support for these platforms. Check the documentation:

```
nanoclaw --help
```

Look for flags like `--slack-token`, `--discord-token`, or `--whatsapp`.

### Option B: Using Existing Integration Tools

There are ready-made tools that connect Claude API to these platforms:

**1. Claude with Slack**

- Use Claude's official Slack integration
- Or use community tools like `slack-claude`
- Set up a Slack App in your workspace
- Connect to your Claude API

**2. Claude with Discord**

- Use discord-bot libraries
- Create a Discord bot in the Developer Portal
- Connect to Claude API

**3. Claude with WhatsApp**

- Use WhatsApp Business API or libraries like `whatsapp-web.js`
- Connect to Claude API

### Option C: Build Your Own (Advanced)

For each platform, you'll need:

```
# Claude API runs via HTTP requests
# Your bot sends messages to Claude and returns responses
```

**Basic flow for all platforms:**

1. Set up NanoClaw or direct API access
2. Create a bot (Slack/Discord/WhatsApp)
3. Write code that:

- Receives incoming messages
- Sends them to Claude API
- Returns the AI response to the user

### Claude API Reference

To connect bots to Claude, use this endpoint:

```
POST https://api.anthropic.com/v1/messages
```

**Request headers:**

```
anthropic-version: 2023-06-01
x-api-key: YOUR_API_KEY
content-type: application/json
```

**Request body:**

```json
{
  "model": "claude-3-haiku-20240307",
  "max_tokens": 1024,
  "messages": [{ "role": "user", "content": "Your message here" }]
}
```

**Response:**

```json
{
  "content": [{ "type": "text", "text": "The AI's reply..." }],
  "stop_reason": "end_turn"
}
```

### Ready-Made Solutions

Don't want to build from scratch? Search these on GitHub:

| Platform | Search Terms                                  |
| -------- | --------------------------------------------- |
| Discord  | "claude discord bot", "anthropic discord"     |
| Slack    | "claude slack integration", "anthropic slack" |
| WhatsApp | "claude whatsapp bot", "whatsapp anthropic"   |

Most require:

- VPS or 24/7 Mac with NanoClaw
- API keys from the platform (free for most)
- Your Claude API key
- Basic configuration

---

## Section 14: What's Next?

### Where to Go From Here

Now that you have this set up, here are some things to explore:

**Learn More About Claude**

- Try different models (Haiku, Sonnet, Opus)
- Experiment with temperature and settings
- Check out Claude's documentation

**Explore NanoClaw Features**

- Multiple conversations
- Export chat history
- Customize settings

**Build Something**

- Create a simple AI-powered app
- Connect to other tools
- Explore automation

**Join Communities**

- r/ClaudeAI on Reddit
- Anthropic Discord
- GitHub discussions

---

### Recommended Next Steps

1. **Try different models** — Switch between Haiku (fast), Sonnet (balanced), and Opus (powerful)
2. **Customize your terminal** — Install Oh My Zsh
3. **Learn about AI prompts** — Research prompt engineering
4. **Explore more tools** — Check out other Claude frontends

---

## Final Words

🎉 **You did it!**

You went from knowing nothing about Terminal to having your own private AI running on your Mac. That's incredible!

Remember:

- ✅ It's okay to look back at this guide
- ✅ It's okay to make mistakes
- ✅ It's okay to experiment
- ✅ It's okay to ask questions

The tech community is incredibly helpful. When you get stuck, search for your error message, and you'll likely find someone who had the same issue.

Now go build something amazing with your new AI setup!

---

_Guide created for Gumroad — The Complete NanoClaw + Claude Setup Guide for Mac_

_Version 1.0 — 2026_
