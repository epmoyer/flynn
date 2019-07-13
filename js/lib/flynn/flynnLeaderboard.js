(function () { "use strict";

Flynn.Leaderboard = Class.extend({

    init: function(attributeList, maxItems, sortDescending){
        this.attributeList = attributeList;
        this.maxItems = maxItems;
        this.sortDescending = sortDescending;
        
        this.leaderList = [];
        this.defaultLeaderList = [];
    },

    isEligible: function(score){
        var is_eligible = true;
        if(Game.config.score == 0){
            is_eligible = false;
        }
        var worst_entry = this.getWorstEntry();
        var better_than_worst = (
            (!this.sortDescending && score < worst_entry.score) ||
            ( this.sortDescending && score > worst_entry.score) );
        var leaderboard_full = this.leaderList.length == this.maxItems;
        if(!better_than_worst && leaderboard_full){
            is_eligible = false;
        }

        return(is_eligible);
    },

    setDefaultList: function(defaultLeaderList){
        this.defaultLeaderList = defaultLeaderList;
    },

    loadFromCookies: function(){
        this.leaderList =[];
        var key = 
            document.title + 
            (Flynn.mcp.developerModeEnabled ? '_Develop' : '') +
            ':LeaderBoard';
        var json_text = Cookies.get(key);
        if(json_text){
            this.leaderList = JSON.parse(json_text);
            if(Flynn.mcp.developerModeEnabled){
                console.log('DEV: flynnLeaderboard: Fetched ' + key + ':' + this.leaderList);
            }
        }

        if(this.leaderList.length == 0){
            // No items found in cookies, so use the defaults.
            this.leaderList = this.defaultLeaderList;
        }

        this.sortAndTruncate();
    },

    saveToCookies: function(){
        var key =
            document.title + 
            (Flynn.mcp.developerModeEnabled ? '_Develop' : '') +
            ':LeaderBoard';
        var value = JSON.stringify(this.leaderList);
        Cookies.set(key, value, { expires: Infinity });
        if(Flynn.mcp.developerModeEnabled){
            console.log('DEV: flynnLeaderboard: Saved ' + key + ':' + value);
        }
    },

    add: function(newEntry){
        this.leaderList.push(newEntry);
        this.sortAndTruncate();
        this.saveToCookies();
    },

    getBestEntry: function(){
        return this.leaderList[0];
    },

    getWorstEntry: function(){
        return this.leaderList[this.leaderList.length-1];
    },

    sortAndTruncate: function(){
        // sort hiscore in ascending order
        if (this.sortDescending){
            this.leaderList.sort(function(a, b) {
                return b['score'] - a['score'];
            });
        } else {
            this.leaderList.sort(function(a, b) {
                return a['score'] - b['score'];
            });
        }

        // Drop the last
        var extraItems = this.leaderList.length - this.maxItems;
        if(extraItems > 0){
            this.leaderList.splice(this.leaderList.length - extraItems, extraItems);
        }
    },

    restoreDefaults: function(){
        this.leaderList = this.defaultLeaderList;
        this.sortAndTruncate();
        this.saveToCookies();
    }
});

}()); // "use strict" wrapper