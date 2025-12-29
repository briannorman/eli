# Privacy Policy for Experimentation Local Interface

**Last Updated:** [Date]

## Overview

Experimentation Local Interface (ELI) is a local development tool that helps developers create and test web experiments. This privacy policy explains how the extension handles your data.

## Data Collection

**ELI does not collect, transmit, or store any personal data or browsing information.**

### Local Storage Only

The extension uses Chrome's local storage API to store the following preferences locally on your device:

- Selected project and variant
- Auto-inject preference
- Projects directory path

This data is stored locally in your browser and is never transmitted to any external server or service.

### Local Development Server

ELI communicates with a local development server running on `http://localhost:8000` on your machine. This communication:

- Only occurs on your local machine
- Never transmits data to external servers
- Is used solely to fetch your local project files

## Permissions

ELI requires the following permissions:

- **`scripting`**: To inject your experiment scripts into web pages for testing
- **`activeTab`**: To access the current tab for script injection
- **`tabs`**: To reload pages and manage tabs during development
- **`storage`**: To save your preferences locally
- **`<all_urls>`**: To allow script injection on any website you're testing
- **`http://localhost:8000/*`**: To communicate with your local development server

These permissions are required for the extension's core functionality and are not used to collect or transmit any data.

## Third-Party Services

ELI does not use any third-party analytics, tracking, or data collection services.

## Contact

If you have questions about this privacy policy, please contact us through the extension's GitHub repository: https://github.com/briannorman/eli

## Changes to This Policy

We may update this privacy policy from time to time. The "Last Updated" date at the top of this policy will reflect any changes.

