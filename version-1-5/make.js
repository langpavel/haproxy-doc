/*
 * HAProxy configuration book builder
 * run it in node.js
 * $ node make.js
 *
 * var m = require('make'); var parts = m.split_chapters(m.text); filenames = m.writeFiles(parts)
 */

var fs = require('fs');
var mkdirp = require('mkdirp').sync;

// regexp
var special_char = /(>>>|[#$%&~_^\\{}<>])/g;
var caption = /\n((\d+\.?)+)\s*([^\n]+)\n-+[ ]*\n/g;


var text = module.exports.text = fs.readFileSync('configuration.txt','utf8');


var split_chapters = module.exports.split_chapters = function(text) {
	var parts = [];
	var prev_part = {
		chapter: 'Summary',
		chapterparts: [],
		title: 'Summary',
	};
	parts.push(prev_part);

	var prev_start = 0;
	text.replace(caption, function(m, chapternum, space, title, offset) {
		if(prev_part !== null) {
			prev_part.text = text.slice(prev_start, offset);
		}
		parts.push(prev_part = {
			chapter: chapternum,
			chapterparts: chapternum.split(/[^\d]+/).filter(function(x) { return x.trim() !== ''; }),
			title: title,
		});
		prev_start = offset + m.length;
		return m;
	});
	prev_part.text = text.slice(prev_start); // to the end

	return parts;
};


var getTeXContent = function(part) {
	var sb = [];
	sb.push('% This is generated content\n');
	sb.push('% Section ', part.chapter, '\n');
	switch(part.chapterparts.length) {
		case 0:
			sb.push('\n\\chapter*{', part.title, '}\n');
			break;
		case 1:
			sb.push('\n\\chapter{', part.title, '}\n');
			break;
		case 2:
			sb.push('\n\\section{', part.title, '}\n');
			break;
		case 3:
			sb.push('\n\\subsection{', part.title, '}\n');
			break;
		default:
			sb.push('\n\\subsubsection{', part.title, '}\n');
			break;
	}

	sb.push('\n\\begin{verbatim}\n');
	sb.push(part.text);
	sb.push('\n\\end{verbatim}\n');

	return sb.join('');
};


var writeFiles = module.exports.writeFiles = function(parts) {
	var i, l, filenamebase, part, includes = [], inputs = [];
	for(i=0, l=parts.length; i<l; i++) {
		part = parts[i];
		filenamebase = part.chapterparts.map(function(p) {
				return p.length === 1 ? '0'+p : p;
			}).join('-') + '--' + part.title.toLowerCase().replace(/[^a-z()]+/g,'-') + '.tex';

		fs.writeFileSync('tex/'+filenamebase+'.tex', getTeXContent(part), 'utf8');

		includes.push(filenamebase);
		inputs.push('\\input{',filenamebase,'.tex}\n');
	}

	fs.writeFileSync('tex/---chapters.tex', inputs.join(''), 'utf8');

	return includes;
};





/*
var escaped_text = text.replace(special_char, function(special){
	if(special === '\\')
		return '\\bslash ';
	else if(special === '<')
		return '$<$';
	else if(special === '>')
		return '$>$';
	else if(special === '>>>')
		return '\\gttt ';
	return '\\'+special;
});



var seccount = /\d+/g;
var caption = /\n\n((\d+\.?)+)\s*([^\n]+)\n-+\s*\n/g;
var chaptered = escaped_text.replace(caption, function(m, num, a, title,b){
	console.log(num+'::'+title, b);
	var len = num.match(seccount);
	len = len === null ? 0 : l.length;
	switch() {
		case 0:
			return '\n%'+num+'\n\\subsubsection{'+title+'}\n\n';
		case 1:
			return '\n%'+num+'\n\\chapter{'+title+'}\n\n';
		case 2:
			return '\n%'+num+'\n\\section{'+title+'}\n\n';
		case 3:
			return '\n%'+num+'\n\\subsection{'+title+'}\n\n';
	}
	return m;
});

var line_delim = /\n\s*-+\s*\n/g;
var result = chaptered.replace(line_delim, '\n\\hrule\n\n');

fs.writeFileSync('configuration.tex', result, 'utf8');

*/
