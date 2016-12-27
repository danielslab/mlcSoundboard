'use strict';

import React, { Component, } from 'react'

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    AsyncStorage,
    ScrollView,
    Dimensions,
    Platform,
    NetInfo
} from 'react-native';

import { Container, Header, Title, Content, Footer, Badge, InputGroup, List, ListItem, Input, FooterTab, Button, Icon, Spinner } from 'native-base';
import Sound from 'react-native-sound';
import RNFetchBlob from 'react-native-fetch-blob'

const windowSize = Dimensions.get('window');

const MAIN_DIR = RNFetchBlob.fs.dirs.DocumentDir
const MAIN_URL = 'https://mountainlaircamp.blob.core.windows.net/mlc-soundbank/'
const JSON_NAME = 'MLCSoundBank.json'

class MainView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            files: [],
            localMap: [],
            remoteMap: [],
            filteredFiles: [],
            isLoading: false,
            currentFetch: 0,
            totalFetch: 0,
            searchQuery: '',
            errorMessage: ''
        }
    }
    componentWillMount() {
        this.getSoundMap()
    }
    getLocalSoundMap = () => {
        AsyncStorage.getItem('soundMap').then((res) => {
            const soundMap = JSON.parse(res);

            if (soundMap) {
                this.setState({
                    localMap: soundMap
                });
            }

            this.isOnlineAction(this.getRemoteSoundMap)
        })
    }
    isOnlineAction = (action) => {
        NetInfo.isConnected.fetch().then(() => {
            NetInfo.isConnected.addEventListener('change', isConnected => {
                if (isConnected) {
                    action()
                }
            });
        });
    }
    getRemoteSoundMap = () => {
        let context = this

        this.fetchData().then((res) => {
            if (res) {
                this.setState({
                    remoteMap: res
                });

                res.map(obj => this.handleSingleFile(obj))

                //alla fine di tutti i map
                // update local json
            }
        })


        // this.fetchJson().then((res) => {
        //     if (res) {
        //         res.map(obj => this.handleSingleFile(obj))

                //creazione cartelle android
                // if (Platform.OS == 'ios') {
                //     res.map(obj => {
                //         //find item in local json
                //         this.manageSingleFile(obj)
                //     })
                // } else {
                //     res.map(obj => this.createDirs(obj))
                // }

                // const boostedSoundMap = res.map((el, i) => {
                //     return {
                //         ...el,
                //         isPlaying: false
                //     }
                // });
                // context.setState({
                //     files: boostedSoundMap,
                //     filteredFiles: boostedSoundMap
                // })

                //update local json
                //AsyncStorage.setItem('soundMap', JSON.stringify(res));
        //     } else {
        //         this.setState({
        //             errorMessage: "Errore connessione server remoto"
        //         })
        //     }
        // })
    }
    handleSingleFile = (file) => {
        //check se è nello stato
        if (this.isLocalFileToUpdate(file)) {
            //check folder

            //fetch singolo file
            this.fetchRemoteFile()
        } else {
            this.syncState(file)
        }
    }
    syncState = (file) => {
        let index = this.state.remoteMap.findIndex( (el) => el.Path === file.Path)
        let tempArray = this.state.remoteMap
        tempArray[i] = {
            ...file,
            isPlaying: false,
            sound: new Sound(file.Path, MAIN_DIR, (e) => {})
        }

        this.setState({
            remoteMap: tempArray
        })
    }
    isLocalFileToUpdate = (remoteFile) => {
        let localFile = this.state.files.find(el => el.Path === remoteFile.Path)

        return !localFile || remoteFile.LastModified > localFile.LastModified
    }
    renderFile = (file, index) => {
        return (
            <ListItem key={index}>
                <TouchableOpacity
                    style={styles.row}
                    onPress={() => this.soundAction(file)}>
                    <View>
                        <Text style={{fontSize: 16, fontWeight: '600', marginBottom: 3}}>{file.Name}</Text>
                        <Text style={{fontSize: 14, fontWeight: '300'}}>by {file.Tags[0]}</Text>
                    </View>
                    <Icon name={file.isPlaying ? 'ios-pause' : 'ios-play'} style={{color: '#24BBFF'}}/>
                </TouchableOpacity>
            </ListItem>
        )
    }
    renderFiles = () => {
        let files = this.state.remoteMap.length > 0 ? this.state.remoteMap : this.state.localMap
        return this.state.files.map((file, i) => this.renderFile(file, i))
    }
    render() {
        return (
            <Container>
                {/* <Header searchBar rounded>
                    <InputGroup>
                        <Icon name="ios-search" />
                        <Input
                            placeholder="Cerca"
                            onChangeText={text => {
                                this.setState({
                                    searchQuery: text
                                })
                            }}  />
                    </InputGroup>
                    <Button transparent onPress={this.filterName}>
                        Cerca
                    </Button>
                </Header> */}
                <Header>
                    <Button transparent>
                        <View/>
                    </Button>

                    <Title>MLC Soundboard</Title>

                    <Button transparent
                        onPress={this.sync}>
                        <Icon name='ios-sync' />
                    </Button>
                </Header>

                <Content>
                    {
                        this.state.isLoading ?
                        <Spinner animating ={this.state.isLoading}  color='black' size='small' /> :
                            null
                    }
                    {
                        this.state.isLoading ?
                        <View style={{padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: windowSize.width}}>
                            <Badge info>Aggiornamento {this.state.currentFetch} di {this.state.totalFetch}</Badge>
                        </View> :
                            null
                    }
                    {
                        this.state.errorMessage ?
                        <View style={{padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: windowSize.width}}>
                            <Badge danger>
                                {this.state.errorMessage}
                            </Badge>
                        </View> : null
                    }

                    {/* <Button
                        onPress={this.test}>
                        Test
                    </Button> */}
                    <List>
                      {this.renderFiles()}
                    </List>
                </Content>

                {/* <Footer>
                    <FooterTab>
                        <Button transparent>
                            <Icon name='ios-call' />
                        </Button>
                    </FooterTab>
                </Footer> */}
            </Container>
        )
    }
    filterName = () => {
        console.log(this.state.files)
        this.setState({
            filteredFiles: this.state.files.filter((el) => {
                return el.Name.indexOf(this.state.searchQuery) >= 0 || el.Tags.find(tag => tag.indexOf(this.state.searchQuery) >= 0)
            })
        })
    }
    soundAction = (file) => {
        if (file.isPlaying) {
            this.stopSound(file)
        } else {
            this.playSound(file)
        }
    }
    smartSync = () => {
        let context = this

        //prendo json remoto
        this.fetchData().then((res) => {
            if (res) {
                // map
                res.map(obj => {
                    this.checkFileExistence(obj)
                })
            } else {
                this.setState({
                    errorMessage: "Errore connessione server remoto"
                })
            }
        })
         //-> se dir non esiste - crea ->
         //-> if not -> writeremotefile -> if exists creo sound e metto in state
        //salvo json in locale
    }
    sync = () => {
        let context = this
        this.fetchData().then((res) => {
            if (res) {

                //creazione cartelle android
                if (Platform.OS == 'ios') {
                    res.map(obj => {
                        //find item in local json
                        this.manageSingleFile(obj)
                    })
                } else {
                    res.map(obj => this.createDirs(obj))
                }

                //update local json
                AsyncStorage.setItem('soundMap', JSON.stringify(res));

                const boostedSoundMap = res.map((el, i) => {
                    return {
                        ...el,
                        isPlaying: false
                    }
                });
                context.setState({
                    files: boostedSoundMap,
                    filteredFiles: boostedSoundMap
                })
            } else {
                this.setState({
                    errorMessage: "Errore connessione server remoto"
                })
            }
        })
    }
    createDirs = (file) => {
        let context = this
        const pathName = file.Path.split('/')[0]
        RNFetchBlob.fs.isDir(MAIN_DIR + '/' + pathName)
        .then((isDir) => {
            if (!isDir) {
                RNFetchBlob.fs.mkdir(MAIN_DIR + '/' + pathName)
                .then(() => {
                    this.manageSingleFile(file)
                 })
                .catch((err) => {
                    console.log(err)
                 })
            } else {
                this.manageSingleFile(file)
            }
        })
    }
    checkFileExistence = (file) => {
        //check esistenza local file
        RNFetchBlob.fs.exists(MAIN_DIR + '/' + file.Path)
            .then((exist) => {
                if (exist) {
                    this.manageFile(file)
                    //creo sound e metto in state
                } else {
                    //writeremotefile
                }
            })
            .catch(() => {
                console.log("error file exist check", file)
            })
    }
    manageSingleFile = (file) => {
        let context = this
        let localObj = context.state.files.find(el => el.Path === file.Path)

        //if (!localObj || file.LastModified > localObj.LastModified) {
            this.fetchRemoteFile(file)
        //}
    }
    async fetchData() {
        const response = await fetch(MAIN_URL + JSON_NAME);
        const json = await response.json();
        return json;
    }
    fetchRemoteFile = (obj) => {
        let context = this
        context.setState({
            totalFetch : this.state.totalFetch + 1,
            isLoading: true
        })
        RNFetchBlob
            .config({
                path : MAIN_DIR + '/' + obj.Path //local target path
            })
            .fetch('GET', MAIN_URL + obj.Path, {})
            .then((res) => {
                console.log('The file saved to ', res.path())

                //this.syncState(obj)
                context.setState({
                    currentFetch : context.state.currentFetch + 1,
                    isLoading: context.state.currentFetch + 1 != context.state.totalFetch
                })
            })
            // Status code is not 200
            .catch((errorMessage, statusCode) => {
                // error handling
                console.log(errorMessage)
            })
    }
    getSoundMap = () => {
        AsyncStorage.getItem('soundMap').then((res) => {
            const soundMap = JSON.parse(res)

            if (soundMap) {
                const boostedSoundMap = soundMap.map((el, i) => {
                    return {
                        ...el,
                        isPlaying: false,
                        //sound: new Sound(el.Path, SOUNDS_LOCAL_PATH, (e) => {})
                    }
                });

                this.setState({
                    files: boostedSoundMap,
                    filteredFiles: boostedSoundMap
                })
            }
            //this.sync()
        })
    }
    stopSound = (file) => {
        let files = this.state.files
        let index = files.findIndex( (el) => el.Path === file.Path)
        if (index >= 0) {
            files[index].isPlaying = !files[index].isPlaying

            this.setState({
                files: files
            })
        }

        file.sound.stop()
    }
    playSound  = (file) => {
        let files = this.state.files
        let index = files.findIndex( (el) => el.Path === file.Path)
        if (index >= 0) {
            files[index].isPlaying = !files[index].isPlaying

            this.setState({
                files: files
            })
        }

        let sound = new Sound(file.Path, MAIN_DIR, (error) => {
            if (error) {
              console.log('failed to load the sound', error);
            } else { // loaded successfully
              console.log('duration in seconds: ' + sound.getDuration() +
                  'number of channels: ' + sound.getNumberOfChannels());
                    files[index].sound = sound
                    this.setState({
                        files: files
                    })

                  //file.sound.enableInSilenceMode(true);
                  console.log("name", sound._filename)
                  sound.play((success) => {
                      if (success) {
                          files[index].isPlaying = !files[index].isPlaying


                          this.setState({
                              files: files
                          })
                      } else {
                          this.setState({
                              errorMessage: "Errore riproduzione audio"
                          })
                      }
                  },
                  (err) => {
                      console.log(err)
                  })
            }
        })

    }
}

var styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 10
    }
});

export default MainView;
