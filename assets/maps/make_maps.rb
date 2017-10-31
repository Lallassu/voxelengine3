#!/usr/bin/ruby
require 'chunky_png'
require 'awesome_print'

img = ChunkyPNG::Image.from_file("map2_ground.png")

height = img.dimension.height
width  = img.dimension.width

file = File.open("test.list", 'w') 
height.times do |i|
    width.times do |j|
        a = ChunkyPNG::Color.a(img[j,i])
        next if a == 0

        r = ChunkyPNG::Color.r(img[j,i])
        g = ChunkyPNG::Color.g(img[j,i])
        b = ChunkyPNG::Color.b(img[j,i])
        file.write("#{i};#{j};#{r};#{g};#{b};#{a}\n")
    end
end
file.close
