import axios from 'axios';
import React, { useRef, useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native';
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType, IRtcEngine, RtcSurfaceView,RtcConnection,
    IRtcEngineEventHandler } from 'react-native-agora';
    import { Buffer } from 'buffer';
const App = () => {
    const agoraEngineRef = useRef<IRtcEngine>();
    const [isJoined, setIsJoined] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [recordingStarted, setRecordingStarted] = useState(false);
    const [resourceId, setResourceId] = useState('');
    const recordingMode = 'mix'; // or 'individual'
    const appId = '95ee23773c964b6baf93d16dbfcb3fe4'; // Replace with your App ID
    const token = '007eJxTYDC146vkyxFe6nF3Z8KrfQ7TudWXH/9ir/Zp/5kz835c1qlWYLA0TU01MjY3N062NDNJMktKTLM0TjE0S0lKS04yTks12cD4Na0hkJGBbWMPKyMDBIL4rAwlqcUlhgwMAI64IM0='; // Replace with your token
    const channelName = 'test1'; // Replace with your channel name
    const uid = 0; // Local user UID
const appCertificate = '84d2f7522ac946cfb5ec30587ea22d06'
    useEffect(() => {
        setupVideoSDKEngine();
        acquireResourceId()
        return () => {
            agoraEngineRef.current?.release();
        };
    }, []);

    const setupVideoSDKEngine = async () => {
        if (Platform.OS === 'android') {
            await getPermission();
        }
        agoraEngineRef.current = createAgoraRtcEngine();
        agoraEngineRef.current.initialize({ appId });
        agoraEngineRef.current.enableVideo();
        agoraEngineRef.current.startPreview(); // Start local video preview
    };

    const join = async () => {
        if (isJoined) return;

        await agoraEngineRef.current?.joinChannel(token, channelName, uid, {
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            publishMicrophoneTrack: true,
            publishCameraTrack: true,
        });
        setIsJoined(true);
        // fetchAgoraProjects()
        
        startRecording()
    };

    const leave = () => {
        agoraEngineRef.current?.leaveChannel();
        setIsJoined(false);
        stopRecording();
    };

    const toggleMic = async () => {
        if (isMicOn) {
             agoraEngineRef.current?.muteLocalAudioStream(true);
        } else {
             agoraEngineRef.current?.muteLocalAudioStream(false);
        }
        setIsMicOn(!isMicOn);
    };

    const toggleVideo = async () => {
        if (isVideoOn) {
             agoraEngineRef.current?.muteLocalVideoStream(true);
        } else {
             agoraEngineRef.current?.muteLocalVideoStream(false);
        }
        setIsVideoOn(!isVideoOn);
    };

    const switchCamera = async () => {
        await agoraEngineRef.current?.switchCamera();
    };



    const acquireResourceId = async () => {
        const recordingUID = 999999; // Replace with a unique integer user ID for the recording service
        const appId ="95ee23773c964b6baf93d16dbfcb3fe4"; // Replace with your Agora App ID
        const customerKey = "19a1e3a14f1a4c37be0cd382b5c8351a"; // Replace with your customer ID
        const customerSecret = "14af535508b943cabf8f56da50f93488"; // Replace with your customer secret
        const plainCredential = `${customerKey}:${customerSecret}`;
        const encodedCredential = Buffer.from(plainCredential).toString('base64');
        const authorizationField = `Basic ${encodedCredential}`;
        
        const body={
            "cname": 'test1',
            "uid": '9999',
            "clientRequest": {
                "resourceExpiredHour": 24,
                "scene": 0
            }
        }
        // Ensure channelName is defined
         // Replace with your channel name
    
        try {
            const response = await axios.post(`https://api.agora.io/v1/apps/${appId}/cloud_recording/acquire`,body, {
                headers: {
                    'Authorization': authorizationField,
                    'Content-Type': 'application/json'
                }
            });
            // console.log('Status code:', response.status);
            if (response.data) {
                // console.log("res data===>",response)
                const resourceId = response.data.resourceId; // Get the resource ID from the response
                // console.log('Acquired Resource ID:', resourceId);
                setResourceId(resourceId);
                return resourceId; // Save this resource ID for use in starting recording
            }
        } catch (error:any) {
            console.error('Error acquiring resource ID:', error.response ? error.response.data : error.message);
        }
    };
    

    // const fetchAgoraProjects = async () => {
    //     try {
    //       // Customer ID and secret
    //       const customerKey = "19a1e3a14f1a4c37be0cd382b5c8351a"; // Replace with your customer ID
    //       const customerSecret ="14af535508b943cabf8f56da50f93488"; // Replace with your customer secret
      
    //       // Concatenate customer key and customer secret and use base64 to encode
    //       const plainCredential = `${customerKey}:${customerSecret}`;
    //       const encodedCredential = Buffer.from(plainCredential).toString('base64');
    //       const authorizationField = `Basic ${encodedCredential}`;
      
    //       // Set request parameters
    //       const options = {
    //         method: 'GET',
    //         url: 'https://api.agora.io/dev/v1/projects',
    //         headers: {
    //           'Authorization': authorizationField,
    //           'Content-Type': 'application/json'
    //         }
    //       };
      
    //       // Make the request using axios
    //       const response = await axios(options);
    //       console.log('Status code:', response.status);
    //       console.log('Data res:', response.data);
    //       return response.data; // Return the data for further use
    //     } catch (error:any) {
    //       console.error('Error fetching projects:', error.response ? error.response.data : error.message);
    //       throw error; // Rethrow the error for further handling
    //     }
    //   };

    

    // Function to stop recording
    
    
    
    const startRecording = async () => {
        const appId ="95ee23773c964b6baf93d16dbfcb3fe4"; // Replace with your Agora App ID
        const customerKey = "19a1e3a14f1a4c37be0cd382b5c8351a"; // Replace with your customer ID
        const customerSecret = "14af535508b943cabf8f56da50f93488"; // Replace with your customer secret
        const plainCredential = `${customerKey}:${customerSecret}`;
        const encodedCredential = Buffer.from(plainCredential).toString('base64');
        const authorizationField = `Basic ${encodedCredential}`;
        if (recordingStarted) return;
        // console.log("Start recording rs id ===>",resourceId)
        try {
            const response = await axios.post(`https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/mode/${recordingMode}/start`, 
                {
                cname: channelName,
                uid: '9999',
                clientRequest: {
                    token:token,
                    recordingConfig: {
                        channelType: 1,
                        streamTypes: 2,
                        maxIdleTime: 30,
                        audioProfile: 1,
                        videoStreamType: 0,
                        transcodingConfig: {
                          height: 640,
                          width: 360,
                          bitrate: 500,
                          fps: 15,
                          mixedVideoLayout: 1,
                          backgroundColor: "#FF0000",
                        },
                      },
                    // storageConfig: {
                    //     vendor: 1,
                    //     region:1, 
                    //     bucket: 'agoratest2', 
                    //     accessKey: 'AKIA4MTWLSANRGY4EQUE', 
                    //     secretKey: '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', 
                    // }
                }
            }
        ,
        {
            headers: {
                'Authorization': authorizationField,
                'Content-Type': 'application/json'
            }
        }
        );

            if (response.data) {
                setResourceId(response.data.resourceId);
                setRecordingStarted(true);
                console.log('Recording started:', response.data);
            }
        } catch (error:any) {
            console.error('Error starting recording:', error.response ? error.response.data : error.message);
        }
    };
    
    const stopRecording = async () => {
        if (!recordingStarted) return;
        console.log("Stop recording ===>")
        try {
            const response = await axios.post(`https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/stop`, {
                cname: channelName,
                uid: uid,
                clientRequest: {
                    token: "",
                }
            });

            console.log('Recording stopped:', response.data);
            setRecordingStarted(false);
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {isJoined && (
                <View style={styles.videoContainer}>
                    {/* Local Video Preview */}
                    {isVideoOn && (
                        <React.Fragment key={0}>
                        <RtcSurfaceView canvas={{ uid: 0 }} style={styles.localVideo} />
                        <Text>Local user uid: {uid}</Text>
                    </React.Fragment>
                    )}
                    {/* Remote Video Preview can be added here */}
                </View>
            )}
            <View style={styles.buttonContainer}>
                {!isJoined ? (
                    <TouchableOpacity onPress={join} style={styles.joinButton}>
                        <Text style={styles.buttonText}>Join Call</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity onPress={toggleMic} style={styles.button}>
                            <Text style={styles.buttonText}>{isMicOn ? 'Mute Mic' : 'Unmute Mic'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleVideo} style={styles.button}>
                            <Text style={styles.buttonText}>{isVideoOn ? 'Stop Video' : 'Start Video'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={switchCamera} style={styles.button}>
                            <Text style={styles.buttonText}>Switch Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={leave} style={styles.endCallButton}>
                            <Text style={styles.buttonText}>End Call</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    localVideo: {
        width: '100%',
        height: '100%',
        backgroundColor: 'gray',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#000',
    },
    button: {
        backgroundColor: 'crimson',
        padding: 10,
        borderRadius: 5,
    },
    endCallButton: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 5,
    },
    joinButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

// Request permissions
const getPermission = async () => {
    if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
    }
};

export default App;
