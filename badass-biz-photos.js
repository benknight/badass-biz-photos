// Converts a photo URI to a different size
function convertPhotoURI(photo_uri, to_size) {
	var re = new RegExp("\/(o|l|m|s|xs|ls|ms|ss|xss|30s|60s|120).jpg");
	return photo_uri.replace(re, '/' + to_size + '.jpg');
}

// tell me what page I'm on
function is_biz_page() {
	return !! window.location.pathname.match('/biz/');
}
function is_biz_photos_page() {
	return !! window.location.pathname.match('/biz_photos');
}

function getBizName() {
	if ( is_biz_page() ) {
		return $('h1').text();
	}
	if ( is_biz_photos_page() ) {
		return $('h2 a').text().slice(0, -1);
	}
}

function getPhotoIndexByURL(photo_url) {
	// TODO
}

// TODO: name these functions better
function derp() {

	// If we're biz_photos page already, yay.
	if ( is_biz_photos_page() ) {

		processImageData(false);

	// If we're on the biz page, get the page.
	} else if ( is_biz_page() ) {

		var url;
		var $slider_link = $('#slide-viewer-all');
		var $biz_photos_link = $('#bizPhotos a');

		if ( $slider_link.length ) {
			url = $slider_link.attr('href');
		} else if ( $biz_photos_link.length ) {
			url = $biz_photos_link.attr('href');
		} else {
			return false;
		}

		// do the ajax request
		$.get(url, processImageData);

	// We found nothing
	} else {
		return false;
	}
}

function processImageData(context) {
	var imageData = [];
	$('.photos img.photo-img', context).each(function(index) {
		imageData.push({
			thumb: this.src,
			image: convertPhotoURI(this.src, 'o')
		});
		if ( ! context ) {
			$(this).attr('galleria-index', index);
		}
	});
	initGalleria(imageData);
}

function enhanceGridPhotos() {
	$('.photos img.photo-img').attr('src', function(index, attr) {
		return convertPhotoURI(attr, 'ls');

	}).click(function(e) {
		// disable page events
		//e.stopPropagation(); e.preventDefault();

		// open galleria at this index
		var gal = Galleria.get(0);
		// gal.bind('image', function() {
		// 	$('#galleria').removeClass('galleria-hidden');
		// 	gal.unbind('image');
		// });
		gal.show( $(this).attr('galleria-index') );
		$('#galleria').removeClass('galleria-hidden');
	});
}

// Init Galleria and put it on the page
function initGalleria(imageData) {
	// create gallery
	$('<div id="galleria">').addClass('galleria-hidden').appendTo('body');

	Galleria.run('#galleria', {
		dataSource: imageData,
		_bizName: getBizName()
	}).ready(function() {

		var themePath = chrome.extension.getURL('galleria/themes/hackathon9/');
		var sprite_classes = [
			'.galleria-thumb-nav-left',
			'.galleria-thumb-nav-right',
			'.galleria-info-link',
			'.galleria-info-close',
			'.galleria-image-nav-left',
			'.galleria-image-nav-right'
		].join(', ');

		$(sprite_classes).css('background-image', 'url(' + themePath + 'classic-map.png)');
	});

	// assign click events that open the galleria
	$('#bizPhotos img').click(function(e) {
		// prevent page events
		e.stopPropagation(); e.preventDefault();

		$('#galleria').removeClass('galleria-hidden');
	});
}

// do do that voodoo that you do
derp();

if ( is_biz_page() ) {
	$('body').addClass('biz-page');
}

if ( is_biz_photos_page() ) {
	$('body').addClass('biz-photos-page');
	// hide stuff
	$('.caption, #photo-nav-add').hide();
	$('#selected-photo').toggle( !! window.location.search.match('select') );

	enhanceGridPhotos();
}

// Iterate on Galleria design
// Profit