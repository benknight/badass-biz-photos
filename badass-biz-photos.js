// require jQuery & Galleria
if ( ! window.jQuery || ! window.Galleria ) {
	return false
}


/**
 * Variables
 */

var is_biz = !! window.location.pathname.match('/biz/')
var is_biz_photos = !! window.location.pathname.match('/biz_photos')
var is_user_photos = !! window.location.pathname.match('/user_photos')
var biz_id                                  // keep track of the biz id
var photo_set_length = is_biz ? 30 : 100    // how many photos to load at a time
var all_photos_loaded = false               // flag this if we've loaded all the biz photos


/**
 * Utility Functions
 */

// convert a photo URI to a different size
function convertPhotoURI(photo_uri, to_size) {
	var re = /\/(o|l|m|s|xs|ls|ms|ss|xss|30s|60s|120).jpg/
	return photo_uri.replace(re, '/' + to_size + '.jpg')
}

// scrape the the page for the gallery name
function getCollectionName() {
	if ( is_biz ) {
		return $('h1').text()
	}
	if ( is_biz_photos ) {
		return $('h2 a').text().replace(':', '')
	}
	if ( is_user_photos ) {
		return $('h2').text()
	}
}

// take an regex and apply it to a url
function get_biz_id_from_url(url, re) {
		var matches = url.match(re)
		if ( matches ) {
			return matches[1]
		} else {
			return false
		}
}

// lightbox show & hide
function hideGallery() {
	$('#galleria').addClass('galleria-hidden')
	$('html').css('overflow', '')
}

function showGallery() {
	$('#galleria').removeClass('galleria-hidden')
	$('html').css('overflow', 'hidden')
}


/**
 * Core Extension Stuff
 */

// the extension's "controller" function which decides how to handle different pages
function badassBizPhotos() {
	// create the Galleria container and append it to the body
	$('<div id="galleria" class="galleria-hidden">').appendTo('body')

	if ( is_biz_photos || is_biz ) {
		var add_photos_url

		if ( is_biz_photos ) {
			// hide stuff
			$('#selected-photo').toggle( !! window.location.search.match('select') )

			// do grid enhancements
			enhanceGridPhotos()

			add_photos_url = $('#photo-details-header-actions a').attr('href')
		}

		if ( is_biz ) {
			// shim a div over the biz photos UIs on the biz page to hijack click
			$('<div id="biz-photos-shim">').appendTo('#slide-viewer')
			$('#biz-photos-shim, #bizPhotos img')
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
			$('#slide-viewer #biz-photos-shim').click(function() {
				Galleria.get(0).show( $(this).data('galleria-index') )
			})

			add_photos_url = $('.add-biz-photo, #slide-viewer-add-photo').attr('href')
		}

		var re = /biz_user_photos\/([\w\-]+)\/upload/
		biz_id = get_biz_id_from_url(add_photos_url, re)

		if ( ! biz_id ) {
			throw new Error('No biz ID found on page.')
		}

		getBizPhotos(0, photo_set_length, true)
	}

	// handle user photos
	if ( is_user_photos ) {
		// scrape dom for photos
		initGalleria( processDOMData(false) )

		// do grid enhancements
		enhanceGridPhotos()
	}
}

function getBizPhotos(index, length, first_run) {
	var imageDataObj = first_run ? [] : Galleria.get(0)

	// do not proceed if we have already loaded all biz photos
	if ( all_photos_loaded ) {
		return false
	}

	// add loading indicator
	$('#galleria').addClass('galleria-loading')

	$.get(
		'/biz_photos/' + biz_id + '/slice/' + index + '/' + (index + length),
		function(data) {
			// if the number of photos returned is less than the set length then we
			// can assume we've loaded all the photos.
			all_photos_loaded = data.photo_slice.length < length

			// process data
			$.each(data.photo_slice, function() {
				var photo = this
				imageDataObj.push({
					thumb: convertPhotoURI(photo.uri, 'ms'),
					image: convertPhotoURI(photo.uri, 'o'),
					layer: [
						'<div class="photo-details">',
							// '<img class="avatar" src="',
							// 	 convertPhotoURI(photo.user.primary_photo, 'ms'),
							// 	'" width="60" height="60" alt="Photo of ',
							// 	photo.user.display_name,
							// '">',
							// '<p class="user-display-name">',
							// 	'<a href="' + photo.user.user_uri + '">',
							// 		photo.user.display_name,
							// 	'</a>',
							// '</p>',
							'<p class="photo-caption">' + photo.photo_caption + '</p>',
							'<p class="time-uploaded">Uploaded ' + $.timeago( photo.time_uploaded ) + '</p>',
						'</div>'
					].join('')
				})
			})
			if ( first_run ) {
				initGalleria(imageDataObj)
			}
			// remove loading
			$('#galleria').removeClass('galleria-loading')
		}
	)
}

// initiate Galleria plugin, put it on the page, and attach events.
function initGalleria(data) {
	Galleria.run('#galleria', {
		_collectionName: getCollectionName(),
		dataSource: data,
		extend: function() {

			// cache a reference to this
			var g = this

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

			// loading
			if ( ! ( is_user_photos || all_photos_loaded ) ) {
				this.bind('image', function() {
					// don't call this multiple times
					if ( $('#galleria').is('.galleria-loading') ) {
						return false
					}
					// get another set
					if ( this.getDataLength() - this.getIndex() < 10 ) {
						getBizPhotos( this.getDataLength(), photo_set_length, false )
					}
				})

				// infinite scroll-like effect
				$('.galleria-thumbnails-list').bind('smartscroll', function() {
					var is_expanded = $('.galleria-thumbnails-container').is('.expanded')
					var pixels_from_bottom = $('.galleria-thumbnails').height() -  $(this).scrollTop() - $(this).height();
					if ( is_expanded && pixels_from_bottom < 100 ) {
						getBizPhotos( g.getDataLength(), photo_set_length, false )
					}
				});
			}

			// lightbox closing
			this.attachKeyboard({
				escape: hideGallery
			})
			this.addElement('close')
			this.$('close').text('×').click(function() {
				hideGallery()
			})
			this.appendChild('container', 'close')
			$('#galleria').click(function(e) {
				if ( e.target == this ) {
					hideGallery()
				}
			})
		}
	})
}

// take a photo page DOM and process it for photos as an alternative ot making
// ajax calls.  The extension originally did this for all photos, now it's
// maintained for just /user_photos which has no ajax endpoint.
function processDOMData(dom) {
	var imageData = []
	$('#photo-thumbnails .photo', dom).each(function(index) {
		$this = $(this)
		imageData.push({
			thumb: $this.find('img.photo-img').attr('src'),
			image: convertPhotoURI( $this.find('img.photo-img').attr('src'), 'o' ),
			title: $this.find('.caption p:first-child a'),
			description: $this.find('.caption p:nth-child(2)').text()
		})
	})
	return imageData
}

// do some nifty UI enhancements on *_photos pages
function enhanceGridPhotos() {
	// convert 100x100 photos to 250x250
	$('.photos img.photo-img').attr('src', function(index, attr) {
		$(this).data('galleria-index', index)
		return convertPhotoURI(attr, 'ls')

	// add click handler to grid so that it opens Galleria at the specified index
	}).click(function(e) {
		var g = Galleria.get(0)
		e.stopPropagation()
		e.preventDefault()
		g.bind('image', function() {
			showGallery()
			g.unbind('image')
		})
		g.show( $(this).data('galleria-index') )
	})
}

// do do that voodoo that you do
$(document).ready( badassBizPhotos )
