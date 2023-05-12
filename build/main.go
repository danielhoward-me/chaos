package main

import (
	"bytes"
	"flag"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
	"github.com/tdewolff/minify/v2/html"
	"github.com/tdewolff/minify/v2/js"
	"github.com/tdewolff/minify/v2/svg"
	htmlParser "golang.org/x/net/html"
)

var publicDir string
var outDir string

var minifyTypes = map[string](struct {
	minifyFunc minify.MinifierFunc
	mimeType   string
}){
	"html": {
		mimeType:   "text/html",
		minifyFunc: html.Minify,
	},
	"js": {
		mimeType:   "application/javascript",
		minifyFunc: js.Minify,
	},
	"css": {
		mimeType:   "text/css",
		minifyFunc: css.Minify,
	},
	"svg": {
		mimeType:   "image/svg+xml",
		minifyFunc: svg.Minify,
	},
}

var fileExtensionsRegex = regexp.MustCompile(`.+\.(.+)`)

var minifier = minify.New()

func initialiseMinifier() {
	for _, minifyType := range minifyTypes {
		minifier.AddFunc(minifyType.mimeType, minifyType.minifyFunc)
	}
}

func main() {
	flag.StringVar(&publicDir, "public-dir", "./public", "The directory to minify")
	flag.StringVar(&outDir, "out-dir", "./out", "The directory to output the minified code to (creates file if it doesn't exist)")
	flag.Parse()

	fmt.Println("Initialising minifier")
	initialiseMinifier()

	fmt.Printf("Reseting %s as out directory\n", outDir)
	os.RemoveAll(outDir)
	if err := createDir(outDir); err != nil {
		fmt.Printf("Failed to create out directory: %s\n", err)
		os.Exit(1)
	}

	fmt.Println("Minifying files")
	if err := minifyPublicFiles(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func createDir(dir string) error {
	return os.MkdirAll(dir, os.ModePerm)
}

func saveFileToOutDir(directory string, fileName string, data []byte) error {
	newDirectory := outDir + directory

	if err := os.MkdirAll(newDirectory, os.ModePerm); err != nil {
		return err
	}

	file, err := os.Create(newDirectory + "/" + fileName)
	if err != nil {
		return err
	}

	defer file.Close()

	if _, err := file.Write(data); err != nil {
		return err
	}

	return nil
}

func getFileExtension(fileName string) string {
	extensionMatches := fileExtensionsRegex.FindStringSubmatch(fileName)
	return extensionMatches[len(extensionMatches)-1]
}

func processHtmlDocument(data []byte) ([]byte, error) {
	doc, err := htmlParser.Parse(strings.NewReader(string(data)))
	if err != nil {
		return []byte{}, err
	}

	timeNow := time.Now()
	unixTime := timeNow.Unix()
	cacheString := strconv.FormatInt(unixTime, 10)

	var processNode func(*htmlParser.Node)
	processNode = func(node *htmlParser.Node) {
		if node.Type == htmlParser.ElementNode {
			key := ""
			if node.Data == "img" || node.Data == "script" {
				key = "src"
			} else if node.Data == "link" {
				key = "href"
			}

			if key != "" {
				for i, attribute := range node.Attr {
					if attribute.Key == key {
						location := attribute.Val

						if strings.Contains(location, "?") {
							location += "&" + cacheString
						} else {
							location += "?" + cacheString
						}

						attribute.Val = location
						node.Attr[i] = attribute
						break
					}
				}
			}
		}

		for child := node.FirstChild; child != nil; child = child.NextSibling {
			processNode(child)
		}
	}

	processNode(doc)

	buf := new(bytes.Buffer)
	if err := htmlParser.Render(buf, doc); err != nil {
		return []byte{}, err
	}

	return buf.Bytes(), nil
}

func minifyPublicFiles() error {
	directories := []string{"/"}
	for {
		directory := directories[0]
		relativeDirectory := publicDir + directory
		directories = directories[1:]

		fmt.Printf("Minifying all files in %s directory\n", relativeDirectory)

		files, err := os.ReadDir(relativeDirectory)
		if err != nil {
			return fmt.Errorf("failed to read %s directory: %s", relativeDirectory, err)
		}

		for _, file := range files {
			if file.IsDir() {
				fmt.Printf("Found directory %s, adding to directories list\n", file.Name())
				directories = append(directories, fmt.Sprintf("%s/%s", directory, file.Name()))
				continue
			}

			fileName := file.Name()
			fileExtension := getFileExtension(fileName)

			fileData, err := os.ReadFile(relativeDirectory + "/" + fileName)
			if err != nil {
				return fmt.Errorf("failed to read file %s: %s", fileName, err)
			}

			if fileExtension == "html" {
				fileData, err = processHtmlDocument(fileData)
				if err != nil {
					return fmt.Errorf("failed to process html file %s: %s", fileName, err)
				}
			}

			minifyType, exists := minifyTypes[fileExtension]
			if exists {
				fileData, err = minifier.Bytes(minifyType.mimeType, fileData)
				if err != nil {
					return fmt.Errorf("failed to minify file %s: %s", fileName, err)
				}

				fmt.Printf("Successfully minified file %s\n", fileName)
			}

			if err := saveFileToOutDir(directory, fileName, fileData); err != nil {
				return fmt.Errorf("failed to save output to out directory for file %s: %s", fileName, err)
			}
		}

		if len(directories) == 0 {
			break
		}
	}

	fmt.Println("Successfully minified all files")
	return nil
}
