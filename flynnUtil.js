function flynnGetUrlValue(VarSearch){
    var SearchString = window.location.search.substring(1);
    var VariableArray = SearchString.split('&');
    for(var i = 0; i < VariableArray.length; i++){
        var KeyValuePair = VariableArray[i].split('=');
        if(KeyValuePair[0] == VarSearch){
            return KeyValuePair[1];
        }
    }
}

function flynnUtilAngleBound2Pi(angle){
	var boundAngle = angle % (Math.PI * 2);
	if(boundAngle<0){
		boundAngle += (Math.PI * 2);
	}
	return (boundAngle);
}