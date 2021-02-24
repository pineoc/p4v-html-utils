// parse spec def
// given a p4 -ztag spec -o <blah>:
//	{  FieldsN: 201 change word 10 key }, 
//	{ FormatsN: Change 1 L }, 
//	{  ValuesN: Type public/restricted },
//	{ PresetsN: Type public
//	{ Comments: # blah \n ... } 
//	... }

// output this:
//	[ { code: 201, tag: Change, comments: ... }, 
//	  { code: 202, ... } ... ]

String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
}

function parseFields(spec)
{
	// code name dataType len fieldType
	var fields = spec.split(' ');
	var ret = {};
	ret.code = fields[0];
	ret.name = fields[1];
	ret.dataType = fields[2];
	ret.length = fields[3];
	ret.fieldType = fields[4];
	
	return ret;
}

function parseFormats(spec)
{
	// name order alignment
	var fields = spec.split(' ');
	var ret = {};
	ret.name = fields[0];
	ret.fieldOrder = fields[1];
	ret.fieldFormat = fields[2];
	
	return ret;
}

function parseValues(spec)
{
	var fields = spec.split(' ');
	var ret = {};
	ret.name = fields[0];
	ret.values = [];
	
	// for lists of pair values, each pair is seperated by a comma
	// e.g. Options has noallwrite/allwrite,noclobber/clobber,etc.
	// 		LineEnd has local/unix/mac/win/share
	var valList = fields[1].split(',');
	if (ret.name != 'Options')
		ret.values = valList[0].split('/');
	else for (var i = 0; i < valList.length; ++i)
		ret.values.push(valList[i].split('/'));
	// now Options will be [ [noallwrite,allwrite], [noclobber, clobber], etc.]
	//	   LineEnd will be [ local, unix, mac, win, share ]
	return ret;
}

function parsePresets(spec)
{
	var fields = spec.split(' ');
	var ret = {};
	
	ret.name = fields[0]
	ret.value = fields[1];
	
	return ret;
}

function parseWords(spec)
{
	var fields = spec.split(' ');
	var ret = {};
	
	ret.name = fields[0];
	ret.words = fields[1];
	
	return ret;
}
	
function parseComments(comments)
{
	var lines = comments.split('\n');
	var commentsByTag = {};
	var lastTag = null;
	
	var tag 	= new RegExp('#\\s*(\\S+):\\s*(.*)$');
	var more	= new RegExp('#(.*)$');
	
	for (var i=0;i<lines.length;++i) {
		var match = lines[i].match(tag);
		if (match) {
			if (match.length != 3) {
				console.log('parseComments match(tag).length == ' + match.length);
				continue;
			}
			// if the last thing we pushed onto the last tag was an emtpy, remove it
			if (lastTag && commentsByTag[lastTag][commentsByTag[lastTag].length - 1].length == 0)
				commentsByTag[lastTag].pop();
				
			lastTag = match[1];
			commentsByTag[lastTag] = [ match[2] ];
			continue;
		}
		if (!lastTag)
			continue;
		match = lines[i].match(more);
		if (match) {
			if (match.length != 2) {
				console.log('parseComments match(more).length == ' + match.length);
				continue;
			}
			commentsByTag[lastTag].push(match[1]);
			continue;
		}
	}

	return commentsByTag;
}

function parseSpecDef(spec)
{
	var fieldByTag = {}, 	// each is { code, name, dataType, len, fieldType }
		formatByTag = {}, 	// each is { name, order, align }
		valueByTag = {},	// each is [ values... ]
		presetByTag = {},	// each is value
		wordsByTag = {},	// each is words
		commentsByTag = {};	// each is [ comments ]
	var occuranceByTag = [];
	
	for (key in spec)
	{
		if (key == "Comments") {
			commentsByTag = parseComments(spec[key]);
			continue;	
		}
		if (key.startsWith("Fields")) {
			var fields = parseFields(spec[key]);
			fieldByTag[fields.name] = fields;
			occuranceByTag[key.substring(6, 8)] = (fields.name);
			continue;
		}
		if (key.startsWith("Formats")) {
			var formats = parseFormats(spec[key]);
			formatByTag[formats.name] = formats;
			continue;
		}
		if (key.startsWith("Values")) {
			var vals = parseValues(spec[key]);
			valueByTag[vals.name] = vals.values;
			continue;
		}
		if (key.startsWith("Presets")) {
			var presets = parsePresets(spec[key]);
			presetByTag[presets.name] = presets.value;
			continue;
		}
		if (key.startsWith("Words")) {
			var words = parseWords(spec[key]);
			wordsByTag[words.name] = words.words;
			continue;
		}
	}

	// group them all together into an array of objects
	var specObj = [];
	var index = 0;

	for (var i=0;i<occuranceByTag.length;++i)	{ // most complete list
		var key = occuranceByTag[i];
		var ele = {};
		for (type in fieldByTag[key]) {
			ele[type] = fieldByTag[key][type];
		}
		if (formatByTag[key] != null) {
			ele.fieldOrder = formatByTag[key].fieldOrder;
			ele.fieldFormat = formatByTag[key].fieldFormat;
		} else {
			ele.fieldOrder = 0;
			ele.fieldFormat = 'normal';
		}
		if (valueByTag[key] != null) {
			ele.values = valueByTag[key];
		}
		if (presetByTag[key] != null) {
			ele.presets = presetByTag[key];
		}
		if (commentsByTag[key] != null) {
			ele.comments = commentsByTag[key];
		}
		if (wordsByTag[key] != null) {
			ele.words = wordsByTag[key];
		}
		specObj[index++] = ele;
	}
	
	return { 'data': specObj, 'size' : index, 'objectType' : spec.altArg };
}