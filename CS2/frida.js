// use -insecure launch param to inject Frida and use this script; otherwise enjoy VAC ban :)
// this script MUST be used to experiment and learn about the CS offets and structures

var client_dll = Module.findBaseAddress('client.dll');
console.log('client.dll base: ' + client_dll);

var engine2_dll = Module.findBaseAddress('engine2.dll');
console.log('engine2.dll base: ' + engine2_dll);

// All offsets dumper: https://github.com/sezzyaep/CS2-OFFSETS/tree/main
// offets from: https://github.com/IMXNOOBX/cs2-external-esp/blob/main/offsets/offsets.json
let offsets = {
	"dwBuildNumber": 5508068,
    "dwEntityList": 27391600,
    "dwLocalPlayer": 25641024,
    "dwPlantedC4": 27845600,
    "dwViewMatrix": 27824240,
    "m_ArmorValue": 9244,
    "m_bIsDefusing": 9194,
    "m_flC4Blow": 4032,
    "m_flFlashOverlayAlpha": 5120,
    "m_flNextBeep": 4028,
    "m_flTimerLength": 4040,
    "m_hPlayerPawn": 2068,
    "m_iAccount": 64,
    "m_iHealth": 836,
    "m_iTeamNum": 995,
    "m_pClippingWeapon": 5024,
    "m_pGameSceneNode": 808,
    "m_pInGameMoneyServices": 1824,
    "m_sSanitizedPlayerName": 1904,
    "m_szName": 3360,
    "m_vOldOrigin": 4900,
    "m_vecAbsOrigin": 208,
    "dwLocalPlayerController": 27715840
};

let entity_list = client_dll.add(offsets["dwEntityList"]).readPointer();
console.log("build number: "+ engine2_dll.add(offsets["dwBuildNumber"]).readU32());
console.log("dwEntityList: "+ entity_list);

let view_matrix_ptr = client_dll.add(offsets["dwViewMatrix"]);
console.log("View Matrix: "+ view_matrix_ptr);

function parseEntityList_players() {
	for(var idx = 0; idx<256; idx++) {
		let player_bucket = entity_list.add((8 * ((idx & 0x7FFF) >> 9)) + 16).readPointer();
		if(player_bucket == 0) {
			console.log("NULL player_bucket (idx="+ idx +")");
			continue;
		}
		let player_ctrller = player_bucket.add(120 * (idx & 0x1FF)).readPointer();
		if(player_ctrller == 0){
			console.log("NULL player_ctrller (idx="+ idx +")");
			continue;
		}
		readPlayer(player_ctrller);
	}
}
parseEntityList_players();

function readPlayer(player_ctrller) {
	let player_pawn_idx = player_ctrller.add(offsets["m_hPlayerPawn"]).readU32();
	if(player_pawn_idx == 0){
		console.log("NULL player_pawn_idx (ptr="+ player_ctrller +")");
		return;
	}
	let player_bucket = entity_list.add((8 * ((player_pawn_idx & 0x7FFF) >> 9)) + 16).readPointer();
	let cs_player_pawn = player_bucket.add(120 * (player_pawn_idx & 0x1FF)).readPointer();
	console.log("Player bucket: "+ player_bucket);
	console.log("Player pawn: "+ cs_player_pawn);

	let player_data = {
		"name": player_ctrller.add(offsets["m_sSanitizedPlayerName"]).readPointer().readUtf8String(),
		"team_num": player_ctrller.add(offsets["m_iTeamNum"]).readInt(),
		"health": cs_player_pawn.add(offsets["m_iHealth"]).readInt(),
		"armor": cs_player_pawn.add(offsets["m_ArmorValue"]).readInt(),
		"position": new Float32Array(cs_player_pawn.add(offsets["m_vOldOrigin"]).readByteArray(12)), // xyz
	};
	console.log("PlayerInfo: ");
	console.log(JSON.stringify(player_data));

	//console.log(hexdump(player_data["position_ptr"], { length: 32 }));

	// let player_name = player_ctrller.add(offsets["m_sSanitizedPlayerName"]).readPointer();
	// console.log("Player name: "+ player_name.readUtf8String());
	// let player_team_num = player_ctrller.add(offsets["m_iTeamNum"]).readInt();
	// console.log("Player team_num: "+ player_team_num);
	// let player_health = cs_player_pawn.add(offsets["m_iHealth"]).readInt();
	// console.log("Player health: "+ player_health);
}

function readLocalPlayer() {
	let local_player_ctrller = client_dll.add(offsets["dwLocalPlayerController"]).readPointer();
	if(local_player_ctrller == 0){
		return;
	}

	//let local_player_pawn_idx = local_player_ctrller.add(offsets["m_hPlayerPawn"]).readU32();
	//if(local_player_pawn_idx == 0){
	//	return;
	//}
	readPlayer(local_player_ctrller);

	// let local_player_bucket = entity_list.add((8 * ((local_player_pawn_idx & 0x7FFF) >> 9)) + 16).readPointer();
	// let cs_local_player_pawn = local_player_bucket.add(120 * (local_player_pawn_idx & 0x1FF)).readPointer();
	// console.log("LocalPlayer bucket: "+ local_player_bucket);
	// console.log("LocalPlayer pawn: "+ cs_local_player_pawn);

	// let player_team_num = local_player_ctrller.add(offsets["m_iTeamNum"]).readInt();
	// console.log("LocalPlayer team_num: "+ player_team_num);
	// let player_name = local_player_ctrller.add(offsets["m_sSanitizedPlayerName"]).readPointer();
	// console.log("LocalPlayer name: "+ player_name.readUtf8String());
}
//readLocalPlayer();