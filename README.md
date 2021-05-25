## FusionAuth Style

This repository contains javascript and CSS for https://fusionauth.io and other FusionAuth sites.

## Setup

```
bundle install
```

## Building

```
sb serve
```

## Release

Bump the version in `build.savant`.

**Commit all changes.** You need to have a clean build directory before you can release. No local changes, no unpushed changes.

Note that you'll have to have an account in the FusionAuth savant repo, and you will want to make sure that running the appropriate `svn list` command doesn't prompt you for a password.

Finally, run:

```
sb release
```

## Adding a new widget

```
sb serve
```

Go to localhost:4000 and view either the `application` or `website` directories. These should contain all the widgets used across either the FusionAuth application or the fusionauth.io website.

If you add a new widget style, add a widget here.
