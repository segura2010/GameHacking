
// base64 decode/encode 
var Base64 = {
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" ,

    encode: function( string )
    {
        var characters = Base64.characters;
        var result     = '';

        var i = 0;
        do {
            var a = string.charCodeAt(i++);
            var b = string.charCodeAt(i++);
            var c = string.charCodeAt(i++);

            a = a ? a : 0;
            b = b ? b : 0;
            c = c ? c : 0;

            var b1 = ( a >> 2 ) & 0x3F;
            var b2 = ( ( a & 0x3 ) << 4 ) | ( ( b >> 4 ) & 0xF );
            var b3 = ( ( b & 0xF ) << 2 ) | ( ( c >> 6 ) & 0x3 );
            var b4 = c & 0x3F;

            if( ! b ) {
                b3 = b4 = 64;
            } else if( ! c ) {
                b4 = 64;
            }

            result += Base64.characters.charAt( b1 ) + Base64.characters.charAt( b2 ) + Base64.characters.charAt( b3 ) + Base64.characters.charAt( b4 );

        } while ( i < string.length );

        return result;
    } ,

    decode: function( string )
    {
        var characters = Base64.characters;
        var result     = '';

        var i = 0;
        do {
            var b1 = Base64.characters.indexOf( string.charAt(i++) );
            var b2 = Base64.characters.indexOf( string.charAt(i++) );
            var b3 = Base64.characters.indexOf( string.charAt(i++) );
            var b4 = Base64.characters.indexOf( string.charAt(i++) );

            var a = ( ( b1 & 0x3F ) << 2 ) | ( ( b2 >> 4 ) & 0x3 );
            var b = ( ( b2 & 0xF  ) << 4 ) | ( ( b3 >> 2 ) & 0xF );
            var c = ( ( b3 & 0x3  ) << 6 ) | ( b4 & 0x3F );

            result += String.fromCharCode(a) + (b?String.fromCharCode(b):'') + (c?String.fromCharCode(c):'');

        } while( i < string.length );

        return result;
    }
};


var libMyGame = Module.findBaseAddress('libMyGame.so');
console.log('base: ' + libMyGame);

var exploit_room = false;
var exploit_leave = false;

var leave_json = {"RH": "ga","PU": "LG","PY": "{}"};
var leave_json = {"RH": "us","PU": "EP","PY": "{\"AV\":\"v22.0/100015930990622/picture?width=9000&height=9000&z=\",\"UN\":\"0\",\"DI\":\"401\"}"};
//var leave_json = {"RH": "us","PU": "SD","PY": "{\"DI\":\"400\"}"};
//var leave_json = {"RH": "ga","PU": "FS","PY": "{}","SQ": 3};
//var leave_json = {
//    "RH": "ga",
//    "PU": "RC",
//    "PY": "{\"PI\":{\"GA\":false,\"NM\":\"0\",\"XP\":0,\"AD\":\"\",\"ABI\":\"pirate_board\",\"WS\":6,\"PT\":3,\"LV\":1,\"snuid\":\"\",\"PBI\":\"pirate_board\",\"VT\":0,\"TID\":0,\"UI\":\"\",\"AF\":\"\",\"LVT\":0,\"AV\":\"juanillo\",\"CLR\":[],\"LLC\":\"\"},\"ST\":true,\"CF\":{\"RM\":0,\"VT\":0,\"VIP\":false,\"CS\":500,\"PP\":4,\"PT\":0,\"SIXP\":false,\"GT\":3,\"GM\":3,\"RT\":7}}"
//};
// var leave_json = {"RH": "jo","PU": "","PY": "{\"os\":\"gplay\",\"cv\":238,\"DD\":\"\",\"snuid\":\"\",\"UI\":\"\",\"BG\":false}"};
var leave_json_str = JSON.stringify(leave_json);
var leave_json_pkt = Memory.alloc(leave_json_str.length+1);
leave_json_pkt.writeUtf8String(leave_json_str);
// var leave_pkt = "ewogICAgIlJIIjogImdhIiwKICAgICJQVSI6ICJMRyIsCiAgICAiUFkiOiAie30iCn0=";

var join_invalid_room_json = {
    "RH": "ga",
    "PU": "RJ",
    "PY": "{\"ST\":true,\"RI\":\"0\",\"PI\":{\"GA\":false,\"NM\":\"Guest1337\",\"XP\":0,\"AD\":\"\",\"ABI\":\"\",\"WS\":1,\"PT\":3,\"LV\":1,\"snuid\":\"\",\"PBI\":\"\",\"VT\":0,\"TID\":0,\"UI\":\"\",\"AF\":\"\",\"LVT\":0,\"AV\":\"\",\"CLR\":[],\"LLC\":\"\"}}"
};
var join_invalid_room_json_str = JSON.stringify(join_invalid_room_json);
var join_invalid_room_json_pkt = Memory.alloc(join_invalid_room_json_str.length+1);
join_invalid_room_json_pkt.writeUtf8String(join_invalid_room_json_str);

// var join_invalid_room_str = "";
// var join_invalid_room_pkt = Memory.alloc(join_invalid_room_str.length+1);
// join_invalid_room_pkt.writeUtf8String(join_invalid_room_str);

var WSObj = null;
var goldExploitPhase = 0; // 0=ping, X=join room(being X=to RI(room id/code)), 2=leave room
//Interceptor.attach(Module.findExportByName("libMyGame.so", '_ZN7cocos2d7network9WebSocket4sendERKSs'), {
Interceptor.attach(libMyGame.add(0x23690cc), {
    onEnter: function (args) {
        this.a0 = args[0];
        this.a1 = args[1];
        this.a2 = args[2];
        console.log("ax::utils::base64Encode " + this.a0 + " " + this.a1 + " " + this.a2);
        // console.log(hexdump(args[0], {
        //     offset: 0,
        //     length: 124,
        //     header: true,
        //     ansi: true
        // }));
        console.log(this.a0.readUtf8String());
        var json = this.a0.readUtf8String();
        exploit_room = json.indexOf("123456")>0;
        if(exploit_room) {
            exploit_room = false;
            args[0] = leave_json_pkt;
            args[1] = ptr(leave_json_str.length);
            console.log("exploit: " + args[0].readUtf8String());
        }

        // exploit_room = this.a0.readUtf8String().indexOf("RJA")>0;
        // if(exploit_room) {
        //     exploit_room = false;
        //     args[0] = join_invalid_room_json_pkt;
        //     args[1] = ptr(join_invalid_room_json_str.length);
        //     console.log("exploit_join: " + args[0].readUtf8String());
        //     exploit_leave = true;
        //     Thread.sleep(2);
        // }else if(exploit_leave) {
        //     exploit_leave = false;
        //     args[0] = leave_json_pkt;
        //     args[1] = ptr(leave_json_str.length);
        //     console.log("exploit_leave: " + args[0].readUtf8String());
        // }
    },
    onLeave: function (retval) {
        // console.log("encoded:");
        // console.log("b64encode " + this.a0 + " " + this.a1 + " " + this.a2);
        // console.log(hexdump(this.a2.readPointer(), {
        //     offset: 0,
        //     length: 124,
        //     header: true,
        //     ansi: true
        // }));
        // console.log(this.a2.readPointer().readUtf8String());
    }
});

Interceptor.attach(libMyGame.add(0x2367d14), {
    onEnter: function (args) {
        this.a0 = args[0];
        this.a1 = args[1];
        this.a2 = args[2];
        console.log("ax::utils::base64Decode " + this.a0 + " " + this.a1 + " " + this.a2);
        // console.log(hexdump(args[0], {
        //     offset: 0,
        //     length: 124,
        //     header: true,
        //     ansi: true
        // }));
        console.log(this.a0.readUtf8String());
    },
    onLeave: function (retval) {
        // console.log("encoded:");
        // console.log("b64encode " + this.a0 + " " + this.a1 + " " + this.a2);
        console.log(hexdump(this.a2.readPointer(), {
            offset: 0,
            length: retval.toInt32(),
            header: true,
            ansi: true
        }));
        // console.log(this.a2.readPointer().readUtf8String());
    }
});



// UserController::getCurrentUser
var CURRENT_USER = ptr(0x1337);
var getCurrentUser_hook = Interceptor.attach(libMyGame.add(0x1770d3c), function () {
    // console.log("??? " + this.context.x0 +" -> "+ this.context.x9);
    // this.context.x22 = ptr(0xc);
    // console.log(hexdump(this.context.x0.readPointer().add(0x440), {
    //     offset: 0,
    //     length: 200,
    //     header: true,
    //     ansi: true
    // }));
    console.log("get_platinum_coins_fn @ "+ this.context.x0.readPointer().add(0x440).readPointer().sub(libMyGame));
    console.log("platinum_coins == "+ this.context.x0.add(0x660).readUInt());
    console.log("coins == "+ this.context.x0.add(0x90).readUInt());
    CURRENT_USER = this.context.x0;
    getCurrentUser_hook.detach();
    // console.log(hexdump(this.context.x0.readPointer().add(0x440), {
    //     offset: 0,
    //     length: 20,
    //     header: true,
    //     ansi: true
    // }));
});
function setCurrentUserPlatCoins(c) {
    CURRENT_USER.add(0x660).writeUInt(c);
}
function setCurrentUserCoins(c) {
    CURRENT_USER.add(0x90).writeUInt(c);
}


// Enable all selection cards for skins/cosmetics
Interceptor.attach(libMyGame.add(0x01891a00), function () {
    //console.log("CollectionCard::getIsPurchased = "+ this.context.x0);
    this.context.x0 = ptr(0x1);
});
Interceptor.attach(libMyGame.add(0x187d78c), function () {
    //console.log("AvatarCard::getIsPurchased = "+ this.context.x0);
    this.context.x0 = ptr(0x1);
});
Interceptor.attach(libMyGame.add(0x187f86c), function () {
    //console.log("BoardCard::getIsPurchased = "+ this.context.x0);
    this.context.x0 = ptr(0x1);
});
Interceptor.attach(libMyGame.add(0x19070fc), function () {
    //console.log("TokenCard::getIsPurchased = "+ this.context.x0);
    this.context.x0 = ptr(0x1);
});
Interceptor.attach(libMyGame.add(0x018bf70c), function () {
    //console.log("DiceCard::isSaleBought = "+ this.context.x0);
    this.context.x0 = ptr(0x1);
});
Interceptor.attach(libMyGame.add(0x18bf6fc), function () {
    //console.log("DiceCard::getDiceCount = "+ this.context.x0);
    this.context.x0 = ptr(6);
});
Interceptor.attach(libMyGame.add(0x018bf704), function () {
    //console.log("DiceCard::getReorderValue = "+ this.context.x0);
    // this.context.x0 = ptr();
});



Interceptor.attach(libMyGame.add(0x28c2a3c), function () {
    console.log("curl_easy_setopt = "+ this.context.x2.readCString());
    // this.context.x0 = ptr();
});
