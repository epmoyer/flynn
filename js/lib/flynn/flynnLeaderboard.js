Flynn.Leaderboard = Class.extend({

    init: function(attributeList, maxItems, sortDescending){
        this.attributeList = attributeList;
        this.maxItems = maxItems;
        this.sortDescending = sortDescending;
        
        this.leaderList = [];
        this.defaultLeaderList = [];
    },

    setDefaultList: function(defaultLeaderList){
        this.defaultLeaderList = defaultLeaderList;
    },

    loadFromCookies: function(){
        this.leaderList =[];
        var numLeaderItems = 0;
        var done = false;
        while(!done){
            var leaderItem = {};
            for(var attributeIndex = 0, len = this.attributeList.length; attributeIndex<len; ++attributeIndex){
                var attributeName = this.attributeList[attributeIndex];
                var key = document.title + ':LB' + numLeaderItems + '_' + attributeName;
                var attributeValue = Cookies.get(key);
                if(Flynn.mcp.developerModeEnabled){
                    console.log('DEV: flynnLeaderboard: Fetched ' + key + ':' + attributeValue);
                }
                if(attributeValue){
                    leaderItem[attributeName] = attributeValue;
                } else{
                    // Stop loading if an entry does not exist.
                    done = true;
                }
                if(attributeIndex === this.maxItems-1){
                    // Don't attempt to load more than the max leaderbaord item limit.
                    done = true;
                }
            }
            if(!done){
                this.leaderList.push(leaderItem);
                ++numLeaderItems;
            }
        }

        if(numLeaderItems===0){
            // No items found in cookies, so use the defaults.
            this.leaderList = this.defaultLeaderList;
        }

        this.sortAndTruncate();
    },

    saveToCookies: function(){
        var i, len;
        for(i=0, len=this.leaderList.length; i<len; i++){
            var leaderItem = this.leaderList[i];
            for(var attributeIndex = 0, len2 = this.attributeList.length; attributeIndex<len2; ++attributeIndex){
                var attributeName = this.attributeList[attributeIndex];
                var key = document.title + ':LB' + i + '_' + attributeName;
                var value = leaderItem[attributeName];
                Cookies.set(key, value, { expires: Infinity });
                if(Flynn.mcp.developerModeEnabled){
                    console.log('DEV: flynnLeaderboard: Saved ' + key + ':' + value);
                }
            }
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
        var self = this;
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