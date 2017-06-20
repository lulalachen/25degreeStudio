Cargo Developer Tools


Documentation
-------------

The most up-to-date Cargo Developer Tools documentation can be found at
http://cargocollective.com/developers/

For a complete index of Cargo's JavaScript methods and Handlebars tags visit
http://cargocollective.com/developers/reference



Assets directory
----------------

Files uploaded to the assets directory are also stored within Cargo's CDN
(Content Delivery Network), allowing them to be served at the highest
possible speed. Each file's URL can be referenced within design.handlebars
by using the asset Handlebars helper with the filename as its content. As an
example, the following would render assets/footer.svg as an img element:

  <img src="{{#asset}}footer.svg{{/asset}}">

There are some limitations when uploading to the assets directory, for
specific information visit http://cargocollective.com/developers/



Mobile directory
----------------

This directory contains the files that provide a mobile optimized version of
your Design. Each file found within it is a direct counterpart to the main
files of your Design:

  - mobile/mobile.handlebars
  - mobile/mobile.css
  - mobile/mobile.js
  - mobile/mobile-display-options.json

The mobile optimized version of your Design is only displayed if the
Display Option "Use mobile design" is checked in a site's Settings - the JSON
object with an id of "mobile" whose value "enabled" is set to true within
display-options.json, and only if all four mobile files exist.

Note that when "Use mobile Design" is checked, but the mobile directory or
any of its files is not present, your Design will use Cargo's universally
available mobile optimized design.



Bug reporting
-------------

For general questions and comments, email developers@cargocollective.com

Should you encounter a bug in the software, please fill out the form at
http://cargocollective.com/developers/help
