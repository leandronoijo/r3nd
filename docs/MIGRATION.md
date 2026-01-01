# Migration Guide: Configurable Spec Directory

This guide explains how to migrate from the hardcoded `rnd/` directory structure to the new flexible configuration system.

---

## Overview

Starting with version 0.2.2, r3nd supports:

1. **Configurable directory names**: Use `r3nd`, `rnd`, `specs`, or any custom name
2. **Multiple spec directories**: Organize specs anywhere in your repository tree
3. **Backward compatibility**: Existing `rnd/` directories continue to work

---

## What Changed?

### Before (v0.2.1 and earlier)
- Hardcoded `rnd/` directory at repository root
- Single spec directory only
- No configuration options

### After (v0.2.2+)
- Configurable directory name via `r3nd.yaml`
- Multiple spec directories supported (e.g., per-service specs)
- Default directory name is now `r3nd` (legacy `rnd` still works)

---

## Migration Scenarios

### Scenario 1: Keep Using `rnd/` (No Changes Needed)

If you want to continue using the legacy `rnd/` directory:

1. Add `r3nd.yaml` to your repository root:

```yaml
spec-dir-name: rnd
```

2. Your existing structure continues to work:

```
project/
├── rnd/
│   ├── product_specs/
│   ├── tech_specs/
│   ├── build_plans/
│   └── ...
└── src/
```

**No file moves or renames required!**

---

### Scenario 2: Migrate from `rnd/` to `r3nd/`

If you want to adopt the new default directory name:

1. Rename your directory:

```bash
git mv rnd r3nd
```

2. Create `r3nd.yaml` (optional - `r3nd` is the default):

```yaml
spec-dir-name: r3nd
```

3. Commit and push:

```bash
git add .
git commit -m "Migrate from rnd to r3nd directory"
git push
```

**That's it!** The CLI and workflows automatically detect the new directory.

---

### Scenario 3: Use a Custom Directory Name

If you prefer a different name like `specs/`:

1. Rename your directory:

```bash
git mv rnd specs
```

2. Create `r3nd.yaml` with your custom name:

```yaml
spec-dir-name: specs
```

3. Commit and push:

```bash
git add .
git commit -m "Use custom 'specs' directory"
git push
```

---

### Scenario 4: Multi-Directory Setup (Monorepo/Multi-Service)

For projects with multiple services or apps:

1. Create spec directories where needed:

```bash
mkdir -p apps/backend/r3nd/{product_specs,tech_specs,build_plans}
mkdir -p apps/frontend/r3nd/{product_specs,tech_specs,build_plans}
mkdir -p services/auth/r3nd/{product_specs,tech_specs,build_plans}
```

2. Optionally keep a root-level directory for shared specs:

```bash
mkdir -p r3nd/{product_specs,tech_specs,build_plans}
```

3. Create `r3nd.yaml`:

```yaml
spec-dir-name: r3nd
```

4. Your structure now looks like:

```
project/
├── r3nd/                    # Shared/platform specs
│   ├── product_specs/
│   └── build_plans/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   └── r3nd/           # Backend-specific specs
│   └── frontend/
│       ├── src/
│       └── r3nd/           # Frontend-specific specs
└── services/
    └── auth/
        ├── src/
        └── r3nd/           # Auth service specs
```

5. CLI commands automatically discover all spec directories:

```bash
# CLI searches the entire tree for directories named 'r3nd'
r3nd agents build-plan

# Workflows trigger on changes to any r3nd directory
# (automatically detected in GitHub Actions)
```

---

## Configuration Reference

### r3nd.yaml

```yaml
# Specification Directory Name
# The name of directories containing r3nd specifications.
# The CLI will search the entire repository tree for directories with this name.
# Default: r3nd
#
# Examples:
#   spec-dir-name: r3nd        # Search for all 'r3nd' directories
#   spec-dir-name: specs       # Search for all 'specs' directories
#   spec-dir-name: rnd         # Use legacy 'rnd' directory name
spec-dir-name: r3nd
```

### CLI Commands

All CLI commands respect the `spec-dir-name` configuration:

```bash
# These commands use the configured directory name
r3nd scaffold
r3nd agents product-spec
r3nd agents tech-spec
r3nd agents build-plan
r3nd bugfix
r3nd analyse
```

### GitHub Workflows

Workflows automatically detect changes in any matching spec directory:

- `02-product-spec-ready.yml`: Triggers on `**/r3nd/product_specs/**` (or configured name)
- `03-tech-spec-ready.yml`: Triggers on `**/r3nd/tech_specs/**`
- `04-build-plan-ready.yml`: Triggers on `**/r3nd/build_plans/**`
- `06-retro-ready.yml`: Uses configured directory for retro output

---

## Backward Compatibility

### Automatic Fallback

The system automatically searches for both `rnd` and `r3nd` directories if no configuration is provided:

1. Checks for `r3nd.yaml` and reads `spec-dir-name`
2. If not configured, searches for `r3nd/` first
3. Falls back to `rnd/` if `r3nd/` doesn't exist
4. Supports legacy projects without any changes

### Workflow Compatibility

GitHub workflows trigger on both directory patterns:

```yaml
paths:
  - 'rnd/product_specs/**'     # Legacy
  - 'r3nd/product_specs/**'    # New default
  - '**/rnd/product_specs/**'  # Multi-directory
  - '**/r3nd/product_specs/**' # Multi-directory
```

---

## Best Practices

### For New Projects

Use the default `r3nd` directory name:

```
project/
├── r3nd/
│   ├── product_specs/
│   └── ...
└── src/
```

### For Existing Projects

Keep using `rnd` or migrate gradually:

```yaml
# r3nd.yaml
spec-dir-name: rnd
```

### For Monorepos

Use service-specific directories:

```
monorepo/
├── r3nd/              # Shared specs
├── services/
│   ├── api/r3nd/      # API specs
│   └── web/r3nd/      # Web specs
└── packages/
    └── shared/r3nd/   # Shared package specs
```

### For Domain-Driven Projects

Organize by domain:

```
project/
├── domains/
│   ├── users/r3nd/
│   ├── orders/r3nd/
│   └── payments/r3nd/
└── shared/r3nd/
```

---

## Troubleshooting

### Issue: CLI doesn't find my spec directory

**Solution:** Check your `r3nd.yaml` configuration:

```bash
# View current configuration
cat r3nd.yaml

# Ensure spec-dir-name matches your directory name
# Example: if you have 'specs/', config should be:
spec-dir-name: specs
```

### Issue: Workflows don't trigger

**Solution:** Ensure your directory path matches one of the workflow patterns:

- Root level: `r3nd/product_specs/`
- Nested: `apps/backend/r3nd/product_specs/`

Both patterns are supported by default.

### Issue: Multiple directories, but CLI only finds one

**Solution:** This is expected for some commands. The CLI uses the first (or root-level) directory by default. For multi-directory projects, organize specs in the most relevant location.

---

## FAQ

### Q: Can I have both `rnd/` and `r3nd/` directories?

A: Technically yes, but not recommended. Choose one naming convention and configure it in `r3nd.yaml`.

### Q: Do I need to update my workflows?

A: No! Workflows now support multiple patterns automatically. Both `rnd` and `r3nd` patterns work out of the box.

### Q: Can different directories have different names?

A: No. The `spec-dir-name` configuration applies globally. All spec directories must use the same name.

### Q: What happens if I don't create `r3nd.yaml`?

A: The system defaults to `r3nd` as the directory name and falls back to `rnd` for backward compatibility.

### Q: Can I ignore certain directories?

A: Yes. The tree search automatically ignores common build/dependency directories (`node_modules`, `dist`, `.git`, etc.).

---

## Support

For issues or questions:

1. Check this migration guide
2. Review `r3nd.yaml.example` for configuration options
3. Open an issue on GitHub: https://github.com/leandronoijo/r3nd/issues

---

**Migration Version:** v0.2.2  
**Last Updated:** 2026-01-01
