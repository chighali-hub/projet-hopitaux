import urllib.request

url = 'https://api.iconify.design/healthicons/pharmacy.svg'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    svg = urllib.request.urlopen(req).read().decode()
    svg = svg.replace('width="1em" height="1em"', 'width="200" height="200"').replace('currentColor', '#10b981')
    with open('c:/Users/hp/Desktop/projet-hopitaux/frontend/src/assets/pharmacy-logo.svg', 'w') as f:
        f.write(svg)
    print("Success")
except Exception as e:
    print("Error:", e)
