// require jQuery & Galleria
if ( ! window.jQuery || ! window.Galleria ) {
	return false
}

// tell me what page I'm on
var IS_BIZ = !! window.location.pathname.match('/biz/')
var IS_BIZ_PHOTOS = !! window.location.pathname.match('/biz_photos')
var IS_USER_PHOTOS = !! window.location.pathname.match('/user_photos')

var addPhotosLink = false

/** Utility Functions */

// convert a photo URI to a different size
function convertPhotoURI(photo_uri, to_size) {
	var re = new RegExp("\/(o|l|m|s|xs|ls|ms|ss|xss|30s|60s|120).jpg")
	return photo_uri.replace(re, '/' + to_size + '.jpg')
}

// get the collection name based on page
function getCollectionName() {
	if ( IS_BIZ ) {
		return $('h1').text()
	}
	if ( IS_BIZ_PHOTOS ) {
		return $('h2 a').text().replace(':', '')
	}
	if ( IS_USER_PHOTOS ) {
		return $('h2').text()
	}
}

function hideGallery() {
	$('#galleria').addClass('galleria-hidden')
	$('html').css('overflow', 'auto')
}

function showGallery() {
	$('#galleria').removeClass('galleria-hidden')
	$('html').css('overflow', 'hidden')
}

/** Core Extension Stuff */

function badassBizPhotos() {

	$('<div id="galleria" class="galleria-hidden">').appendTo('body')

	// if we're biz_photos page already, yay.
	if ( IS_BIZ_PHOTOS || IS_USER_PHOTOS ) {

		// hide stuff
		$('.caption, #photo-nav-add').hide()
		$('#selected-photo').toggle( !! window.location.search.match('select') )

		processImageData(false)

		// do grid enhancements
		enhanceGridPhotos()

	// if we're on the biz page, get the page in an iframe.
	} else if ( IS_BIZ ) {

		var biz_photos_url
		var $slider_link = $('#slide-viewer-all')
		var $static_link = $('#bizPhotos a')

		// shim a div over the biz photos UIs on the biz page to hijack click
		$('<div id="biz-photos-shim">')
			.appendTo('#bizPhotos, #slide-viewer')
			.click(function(e) {
				// prevent page events
				e.stopPropagation()
				e.preventDefault()
				showGallery()
			}
		)

		// update the slideshow shim with the current galleria index
		$('#slide-viewer').bind('DOMSubtreeModified', function(e) {
			current_index = $(this).find('img:visible').prevAll('img').length
			$('#biz-photos-shim').data('galleria-index', current_index)
		})

		if ( $slider_link.length ) {
			biz_photos_url = $slider_link.attr('href')
		} else if ( $static_link.length ) {
			biz_photos_url = $static_link.attr('href')
		} else {
			return false
		}

		$.get(biz_photos_url, processImageData)

	// or we're not on a page this extension is meant to act on.
	} else {
		return false
	}
}

// take a photo DOM and process it for photos
function processImageData(context) {
	var imageData = []
	$('#photo-thumbnails .photo', context).each(function(index) {
		$this = $(this)
		imageData.push({
			thumb: $this.find('img.photo-img').attr('src'),
			image: convertPhotoURI( $this.find('img.photo-img').attr('src'), 'o' ),
			title: $this.find('.caption p:first-child a'),
			description: $this.find('.caption p:nth-child(2)').text() +
				'<span class="date">Added 30 days ago</span>'
		})
		$this.find('img.photo-img').data('galleria-index', index)
	})
	addPhotosLink = $('#photo-details-header-actions a', context)
	initGalleria(imageData)
}

function enhanceGridPhotos() {
	// convert 100x100 photos to 250x250
	$('.photos img.photo-img').attr('src', function(index, attr) {
		return convertPhotoURI(attr, 'ls')

	// add click handler to grid so that it opens Galleria at the specified index
	}).click(function(e) {
		// prevent user_photos from reloading the page
		if ( IS_USER_PHOTOS || IS_BIZ_PHOTOS ) {
			e.stopPropagation()
			e.preventDefault()
		}
		// open galleria and page to the photo that was clicked, preventing transition effect
		var gal = Galleria.get(0)
		gal.bind('image', function() {
			showGallery()
			gal.unbind('image')
		})
		gal.show( $(this).data('galleria-index') )
	})
}

// initiate Galleria plugin, put it on the page, and attach events.
function initGalleria(imageData) {
	// create hidden galleria div
	Galleria.run('#galleria', {
		dataSource: imageData,
		_collectionName: getCollectionName(),
		extend: function() {
			// css
			var themePath = chrome.extension.getURL('galleria/themes/hackathon9/')
			var sprite_classes = [
				'.galleria-thumb-nav-left',
				'.galleria-thumb-nav-right',
				'.galleria-info-link',
				'.galleria-info-close',
				'.galleria-image-nav-left',
				'.galleria-image-nav-right'
			].join()
			$(sprite_classes).css('background-image', 'url(' + themePath + 'classic-map.png)')

			// add photos link
			this.$('add-photos-link').html( addPhotosLink )

			// closing
			this.attachKeyboard({
				escape: hideGallery
			})
			this.addElement('close')
			this.$('close').text('×').click(function() {
				hideGallery()
			})
			this.appendChild('container', 'close')
		}
	})

	$('#biz-photos-shim').click(function() {
		Galleria.get(0).show( $(this).data('galleria-index') )
	})

	$('#galleria').click(function(e) {
		if ( e.target.id == 'galleria' ) {
			hideGallery()
		}
	})
}

// do do that voodoo that you do
// TODO: namespace this extension as a class
badassBizPhotos()
