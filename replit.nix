{ pkgs }: {
	deps = [
		pkgs.nodejs-16_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
    (pkgs.aspellWithDicts(ps: [ ps.en ]))
	];
}