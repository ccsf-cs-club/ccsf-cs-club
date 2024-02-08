help:
	echo "This is a justfile! Install the `just` command to use these shortcuts, or just read this file!"

dev:
	yarn dev

fmt:
	yarn prettier . --write
