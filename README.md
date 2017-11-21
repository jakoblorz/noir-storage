# zipstore
Create a hassle-free small-scale file-server.

## Installation
Currently, only Linux Distributions are supported, which support **systemd** (*tested in ubuntu 16.04*):
1. Clone this repository into `/opt`
2. cd into the repository: `cd ./zipstore`
3. Invoke the install script with sudo-privileges: `sudo ./install.sh`
4. The script will have registered and built this service and will let it run using systemd with auto-restart.

## Usage
This service will listen on default port 8080 (customize the `zipstore.service` file and see section **Customization**) and has 3 routes registered:
- POST `/?ref=<field>` upload a file using form-data. Specify the form-key for the file you wish to upload in the url at `<field>`:
```bash
curl -X POST \
  'http://localhost:8000/?ref=data' \
  -H 'cache-control: no-cache' \
  -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
  -F 'data=@/path/to/file.pdf'
```
```json
{
    "id": "2d7581df-7db5-4859-b494-13956280695e",
    "mime": "application/pdf",
    "extname": ".pdf"
}
```
- GET `/<id>` download a file. Use the id from the upload-response in the url:
```bash
curl -X GET \
  http://localhost:8000/2d7581df-7db5-4859-b494-13956280695e \
  -H 'cache-control: no-cache'
```
- DELETE `/<id>` delete a file. Use the id from the upload-response in the url:
```bash
curl -X DELETE \
  http://localhost:8000/2d7581df-7db5-4859-b494-13956280695e \
  -H 'cache-control: no-cache'
```

## Customization
This service is sensitive to the following env-variables:
- `FILEROOT`: specify the folder where files should be stored (*will be created if it does not exist*); `os.homedir()/.zipstore-data` is the default folder, `/var/lib/zipstore/.data` is the default service folder.
- `NODE_ENV`: specify the deploy-setting (*will only impact logging output look*)
- `PORT`: specify the port to listen for incomming requests; `8000` is the default port, `8080` is the default service port.
- `HOSTNAME`: specify the interface to listen to (*127.0.0.1*, *localhost*, *0.0.0.0*, *host-ip*); `localhost` is the default hostname (for the service as well: **use nginx to allow external access to this service to enhance security**).