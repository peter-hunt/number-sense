# This is a self-contained Nix shell configuration for your local VS Code environment.
# It replaces the .idx/dev.nix file.

# This 'let' block imports the Nix package set so the file can stand on its own.
let
  pkgs = import <nixpkgs> {
    # This optional line ensures you're using the unstable channel, just like in your old file.
    # Your system's Nix configuration may also control this.
    config.nixpkgs.hostPlatform = "x86_64-linux";
    config.nixpkgs.overlays = [];
  };
in
  # pkgs.mkShell is the standard function to create a development environment for 'nix-shell'.
  pkgs.mkShell {
    # We use 'buildInputs' to list all the packages you want available in your shell.
    # This is copied directly from your .idx/dev.nix file.
    buildInputs = [
      pkgs.python313
      (pkgs.python313.withPackages (ps: [
        ps.flask
        ps.autopep8
        ps.pip
      ]))
    ];

    # shellHook contains commands that run automatically every time you enter this environment.
    # This is the local replacement for the 'onCreate' and 'previews' sections of your old file.
    shellHook = ''
      echo "Nix shell is activated."
      echo "Your Python environment with Flask is ready."

      # Set a default PORT, similar to how the IDX preview did.
      # The devserver.sh script should use this variable.
      export PORT=8080

      echo "To start your application, run: ./devserver.sh"
      echo "Then, open a browser to http://localhost:8080 to see your preview."
    '';
  }
