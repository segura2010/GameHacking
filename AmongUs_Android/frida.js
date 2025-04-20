
var gamelib = Module.findBaseAddress('libil2cpp.so');
console.log('base: ' + gamelib);

// Interceptor.attach(gamelib.add(0x2557d8c), {
//     onEnter: function (args) {
//         console.log("CosmicubeCell$$CanBePurchased = "+ this.context.x0);
//     },
//     onLeave: function(retval) {
//         console.log("ret: "+ retval);
//         retval = ptr(0x1);
//     }
// });

// Enable all skins/cosmetics
Interceptor.attach(gamelib.add(0x2566de8), {
    onEnter: function (args) {
        //console.log("PlayerPurchasesData$$GetPurchase = "+ this.context.x0);
    },
    onLeave: function(retval) {
        this.context.x0 = ptr(0x1);
    }
});
Interceptor.attach(gamelib.add(0x22674dc), {
    onEnter: function (args) {
        console.log("FullAccount$$CanSetCustomName = "+ this.context.x1);
        this.context.x1 = ptr(0x1);
    },
    onLeave: function(retval) {
    }
});
Interceptor.attach(gamelib.add(0x227a454), {
    onEnter: function (args) {
        console.log("KidAccount$$CanSetCustomName = "+ this.context.x1);
        this.context.x1 = ptr(0x1);
    },
    onLeave: function(retval) {
    }
});
Interceptor.attach(gamelib.add(0x44f0680), {
    onEnter: function (args) {
        //console.log("UnityEngine.GameObject$$SetActive = "+ this.context.x1);
        //this.context.x1 = ptr(0x1);
    },
    onLeave: function(retval) {
    }
});



///////
//


//console.log(Module.findExportByName(null,"memcmp"));
//Interceptor.attach(Module.findExportByName(null, "memcmp"), {
//    onEnter: function (args) {
//        console.log("memcmp = "+ this.context.x0.readCString());
//        //console.log('mprotect called from:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
//    },
//    onLeave: function(retval) {
//    }
//});


// dumps..
function check_fns() {
    var fns = ["mprotect", "open", "pthread_create", "ptrace", "realloc", "mmap", "munmap", "free", "mremap", "fork", "dlopen", "dlsym", "dlclose", "memcmp", "strstr"];
    for(var i=0;i<fns.length;i++){
        var fn = fns[i];
        console.log("-- "+ fn + hexdump(Module.findExportByName(null, fn), { length: 16, ansi: true }));
    }
}

check_fns();

Interceptor.attach(Module.getExportByName(null, "open"), {
  onEnter: function (args) {
    var path = args[0].readUtf8String();
    if (path && path.includes("/proc/self/status")) {
      console.log("App checking /proc/self/status!");
    }
if (path && path.includes("/proc/self/maps")) {
      console.log("App scanning memory maps!");
        console.log('mprotect called from:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
    }
  }
});

// Interceptor.attach(Module.getExportByName(null, "pthread_create"), {
//   onEnter: function (args) {
//       var mod = Process.findModuleByAddress(args[2]);
//       console.log("pthread_create: fn @ "+ args[2] +" Module: "+ mod.name +" Base: "+ mod.base +" fn offset: "+ args[2].sub(mod.base));
//       if(mod.name == "libil2cpp.so") {
//           console.log(hexdump(args[3], {length: 8*8, ansi: true}));
//       }
//       if(mod.name == "libart.so") {
//           console.log('pthread_create called from:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
//       }
//   }
// });


function check_strs() {
    var strs = ["frida", "frida-server", "frida-agent", "gum-js-loop", "gmain", "linjector"];
    for(var i=0;i<strs.length;i++){
        var s = strs[i];
        var m = Memory.alloc(s.length);
        m.writeUtf8String(s);
        console.log("-- "+ s + hexdump(m, { length: s.length, ansi: true }));
    }
}

// Interceptor.replace(gamelib.add(0x2023c10), new NativeCallback(function(p1){
//     console.log("call to unk fn killed");
// }, 'void', ['pointer']));
//

var get_networkedplayername_fn = new NativeFunction(gamelib.add(0x25a51f8), 'pointer', ['pointer', 'pointer']);

function print_NetworkedPlayerInfo_Fields(player) {
    var fields = player.add(0x10);
    var player_control = fields.add(0x70).readPointer();
    var player_control_fields = player_control.add(0x10);

    var role_behaviour = fields.add(0x58).readPointer();
    var role_fields = role_behaviour.add(0x10);
    var role_team = role_fields.add(0x5c).readUInt();

    var player_level = fields.add(0x50).readUInt();

    var player_name = get_networkedplayername_fn(player, ptr(0));
    var name_fields = player_name.add(0x10);

    console.log("["+role_team +"]-["+name_fields.add(0x4).readUtf16String() +"] -- Level: "+player_level+" // Team (Impostor = 1): "+role_team);
    //console.log(hexdump(name_fields.add(0x4), { length: 30, ansi: true }));
}

Interceptor.attach(gamelib.add(0x25a6ed8), {
    onEnter: function (args) {
        console.log("NetworkedPlayerInfo$$OnGameStart "+this.context.x0);
        print_NetworkedPlayerInfo_Fields(this.context.x0);
    },
    onLeave: function(retval) {
    }
});
