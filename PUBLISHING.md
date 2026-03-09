# Publishing Your MCP Server to npm

## Steps to Publish

### 1. Update package.json

Replace these values in package.json:

- **Package name**: Change `@yourusername/swagger-mcp` to your desired name
  - For scoped packages: `@your-npm-username/swagger-mcp`
  - For unscoped: `swagger-mcp` (if available)
  
- **Author**: Add your name and email
  
- **Repository**: Add your GitHub repository URL

### 2. Create GitHub Repository (Optional but Recommended)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/swagger-mcp.git
git push -u origin main
```

### 3. Create npm Account

If you don't have an npm account:
1. Go to https://www.npmjs.com/signup
2. Create an account

### 4. Login to npm

```bash
npm login
```

Enter your npm credentials.

### 5. Test Locally

Before publishing, test your package:

```bash
# Install dependencies
npm install

# Test the server
SWAGGER_URL=http://localhost:8080/v3/api-docs node server.js
```

### 6. Publish to npm

For scoped packages (recommended for first-time publishers):

```bash
npm publish --access public
```

For unscoped packages:

```bash
npm publish
```

### 7. Update MCP Configuration

After publishing, users can install your package globally:

```bash
npm install -g @yourusername/swagger-mcp
```

And configure it in their MCP settings:

```json
{
  "mcpServers": {
    "swagger-mcp": {
      "command": "npx",
      "args": ["-y", "@yourusername/swagger-mcp"],
      "env": {
        "SWAGGER_URL": "http://localhost:8080/v3/api-docs"
      }
    }
  }
}
```

## Publishing Updates

When you make changes:

1. Update the version in package.json:
   - Patch: `1.0.0` → `1.0.1` (bug fixes)
   - Minor: `1.0.0` → `1.1.0` (new features)
   - Major: `1.0.0` → `2.0.0` (breaking changes)

2. Commit your changes

3. Publish:
   ```bash
   npm publish
   ```

Or use npm version:
```bash
npm version patch  # or minor, or major
npm publish
```

## Checklist Before Publishing

- [ ] Update package name in package.json
- [ ] Add your author information
- [ ] Update repository URL
- [ ] Test the package locally
- [ ] Update README with correct package name
- [ ] Ensure SWAGGER_URL environment variable works
- [ ] Create GitHub repository (optional)
- [ ] Have npm account ready
- [ ] Run `npm install` successfully
- [ ] No sensitive information in code

## Common Issues

### Package name already taken
Use a scoped package: `@your-npm-username/package-name`

### Permission denied
Make sure you're logged in: `npm login`

### 401 Unauthorized
Run `npm login` again or check your npm credentials

### Version already published
Increment the version number in package.json

## After Publishing

Share your package:
- Update README with installation instructions
- Share on social media
- Add to MCP registry (if available)
- Create documentation/examples
