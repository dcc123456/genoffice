#!/bin/sh
# deb/rpm post-install: expose the officecc command line shipped inside the app.
# Only an absent name, a dead link or a link into our own install dir is taken
# over; anything else at /usr/bin/officecc belongs to another program (officecc#893).
set -e
launcher="/opt/Office-cc/resources/cli/officecc"
link="/usr/bin/officecc"
[ -x "$launcher" ] || exit 0
if [ -L "$link" ]; then
  case "$(readlink "$link")" in
    /opt/Office-cc/*) ;;
    *) [ -e "$link" ] && { echo "officecc: $link is another program, left as is; run: ln -s $launcher $link" >&2; exit 0; } ;;
  esac
elif [ -e "$link" ]; then
  echo "officecc: $link is another program, left as is; run: ln -s $launcher $link" >&2
  exit 0
fi
ln -sfn "$launcher" "$link"
exit 0
