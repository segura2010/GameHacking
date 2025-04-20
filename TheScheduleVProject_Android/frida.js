

var gamelib = Module.findBaseAddress('libil2cpp.so');
console.log('base: ' + gamelib);


// dumps..
function check_fns() {
    var fns = ["mprotect", "open", "pthread_create", "ptrace", "realloc", "mmap", "munmap", "free", "mremap", "fork", "dlopen", "dlsym", "dlclose", "memcmp", "strstr"];
    for(var i=0;i<fns.length;i++){
        var fn = fns[i];
        console.log("-- "+ fn + hexdump(Module.findExportByName(null, fn), { length: 16, ansi: true }));
    }
}
//check_fns();

function readSystemString(s_ptr) {
    var str_fields = s_ptr.add(0x10);
    var str_s = str_fields.add(0x4);
    return str_s.readUtf16String();
}

Interceptor.attach(gamelib.add(0x167d878), {
    onEnter: function (args) {
        console.log("AdsManager$$ShowBannerAd");
    },
    onLeave: function(retval) {
    }
});

Interceptor.attach(gamelib.add(0x167e9d0), {
    onEnter: function (args) {
        console.log("BankController$$get_NoAdsPurchased");
    },
    onLeave: function(retval) {
        this.context.x0 = ptr(0x1);
    }
});

// change money&energy
Interceptor.attach(gamelib.add(0x1680cd0), {
    onEnter: function (args) {
        console.log("MoneyController$$get_Money");
    },
    onLeave: function(retval) {
        console.log(this.context.s0);
        this.context.s0 = 900000;
    }
});
Interceptor.attach(gamelib.add(0x168edf4), {
    onEnter: function (args) {
        console.log("MoneyController$$get_Energy");
    },
    onLeave: function(retval) {
        this.context.x0 = ptr(300000);
    }
});

// change player level
var set_player_level = new NativeFunction(gamelib.add(0x1698400), 'void', ['pointer', 'uint32', 'pointer']);
Interceptor.attach(gamelib.add(0x16983ac), {
    onEnter: function (args) {
        console.log("PlayerLevelController$$get_PlayerLevel");
        set_player_level(this.context.x0, 10, this.context.x1);
    },
    onLeave: function(retval) {
        console.log(this.context.x0);
        //this.context.x0 = ptr(0x3);
        //console.log(this.context.x0);
    }
});

// replace adsmanager.star to avoid showing ads
var adsmanager_start_ptr = gamelib.add(0x167d2e8);
Interceptor.replace(adsmanager_start_ptr, new NativeCallback(function(t, method){
    console.log("AdsManager$$Star replace called!");
}, 'void', ['pointer', 'pointer']));

//Interceptor.attach(gamelib.add(0x167d2e8), {
//    onEnter: function (args) {
//        console.log("AdsManager$$Start");
//    },
//    onLeave: function(retval) {
//    }
//});

// hook function used to check if an object can be placed; returning always true allows you to put object everywhere
Interceptor.attach(gamelib.add(0x16bc818), {
    onEnter: function (args) {
        console.log("PlacingMode$$CanBePlaced");
    },
    onLeave: function(retval) {
        console.log(this.context.x0);
        this.context.x0 = ptr(0x1);
        //console.log(this.context.x0);
    }
});
