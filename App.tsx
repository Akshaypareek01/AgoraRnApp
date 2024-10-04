import axios from 'axios';
import React, {useRef, useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Switch
} from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
  RtcConnection,
  IRtcEngineEventHandler,
} from 'react-native-agora';
import {Buffer} from 'buffer';
import AgoraUIKit from 'agora-rn-uikit';
const App = () => {
  const agoraEngineRef = useRef<IRtcEngine>();
  const eventHandler = useRef<IRtcEngineEventHandler>();
  const Base_url = 'https://aesthetics-backend.onrender.com/';
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [recordingStarted, setRecordingStarted] = useState(false);
  const [resourceId, setResourceId] = useState('');
  const [sid, setsid] = useState('');
  const [msg,setMsg] = useState('');
  const [loading,setLoading] = useState(false);
  const [isHost, setIsHost] = useState(true); // User role
    const [remoteUid, setRemoteUid] = useState(0); // Uid of the remote user
    const [message, setMessage] = useState(''); // User prompt message
    const [channelName,setChannelName] = useState(null);
    const token1 =
    '007eJxTYIjKXlRpz/Ruwro9rBflTHX8+oUSDDsyezS+L5xnM+FK3lkFBkvT1FQjY3Nz42RLM5Mks6TENEvjFEOzlKS05CTjtFSTV63/0xoCGRmuhv5nYWSAQBCfjaEktbjE0IiBAQBsQyEG'; // Replace with your token // Replace with your channel name
    const [token,setToken] = useState(null)
  const recordingMode = 'mix'; // or 'individual'
  const appId = '95ee23773c964b6baf93d16dbfcb3fe4'; // Replace with your App ID
 
  const uid = 0; // Local user UID
  const appCertificate = '84d2f7522ac946cfb5ec30587ea22d06';

  const recordingurl = `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;

  const [videoCall, setVideoCall] = useState(false);
  const connectionData = {
      appId: '95ee23773c964b6baf93d16dbfcb3fe4',
      channel: channelName ? channelName : '',
      token: token ? token : '',
  };


  const getChannelDetails = async () => {
    try {
      const res = await axios.get(`${Base_url}api/token`);

      if(res.data){
        const data = res.data
        setChannelName(data.channelName);
        setToken(data.token)
      }
      console.log("Response of get channel details ==>", res.data); // Log the data from the response
      return res.data; // Optionally return the data for further use
    } catch (err) {
      console.log("Channel details error", err);
    }
  };


  useEffect(() => {
    getChannelDetails().then((res)=>{
        setupVideoSDKEngine();
        acquireResourceId(res);
    });
    
    return () => {
      agoraEngineRef.current?.release();
    };
  }, []);

  const postData = async (data: any) => {
    const data1 = {
      ...data,
      appId: appId,
    };
    console.log('res in data post ===>', data1);
    try {
      const response = await axios.post(
        `${Base_url}api/myData/create-data`,
        data1,
      );
      console.log('Response from post data:', response.data);
    } catch (error) {
      console.error('Error posting data:', error);
    }
  };

  const getfilename = async () => {
    try {
      const recordingUID = 999999; // Replace with a unique integer user ID for the recording service
      // Replace with your Agora App ID
      const customerKey = '19a1e3a14f1a4c37be0cd382b5c8351a'; // Replace with your customer ID
      const customerSecret = '14af535508b943cabf8f56da50f93488'; // Replace with your customer secret
      const plainCredential = `${customerKey}:${customerSecret}`;
      const encodedCredential = Buffer.from(plainCredential).toString('base64');
      const authorizationField = `Basic ${encodedCredential}`;
      console.log('Received data from frontend:');

      // Construct the Agora URL
      const agoraUrl = `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;
    //   console.log('Constructed Agora URL:', agoraUrl);

      // Credentials

      // Send the GET request to Agora
    //   console.log('Sending GET request to Agora...');
      const agoraResponse = await axios.get(agoraUrl, {
        headers: {
          Authorization: authorizationField,
          'Content-Type': 'application/json',
        },
      });

    //   console.log('Received response from Agora:', agoraResponse.data);

      // Extract fileList from serverResponse if present
      const fileName = agoraResponse.data.serverResponse?.fileList;

      return fileName;
    } catch (err) {
      console.log('Error in getfilename', err);
    }
  };

  const endMeeting = async () => {
    console.log('Sid end meet -===>',sid);
    try {
        setLoading(true);
        const File = await  getfilename();
        console.log("File name ===>",File,sid)
      const response = await axios.post(`${Base_url}api/myData/end-meeting`, {
        sid: sid,
        fileName:File // Pass the sid in the request body
      });

      // Handle the response
      console.log('Meeting ended successfully:', response.data);
      if(response.data && response.data.uploadResponse && response.data.uploadResponse.transcription){
        const data =response.data.uploadResponse.transcription.text
        setMsg(data);
      }
      setLoading(false);
    } catch (error: any) {
      // Handle errors
      console.error(
        'Error ending the meeting:',
        error.response ? error.response.data : error.message,
      );
      setMsg("Server error :) " )
      setLoading(false);
    }
  };

  const setupVideoSDKEngine = async () => {
    try {
        // Create RtcEngine after obtaining device permissions
        if (Platform.OS === 'android') {
            await getPermission();
        }
        agoraEngineRef.current = createAgoraRtcEngine();
        const agoraEngine = agoraEngineRef.current;
        eventHandler.current = {
            onJoinChannelSuccess: () => {
                // showMessage('Successfully joined channel: ' + channelName);
                setIsJoined(true);
            },
            onUserJoined: (_connection: RtcConnection, uid: number) => {
                // showMessage('Remote user ' + uid + ' joined');
                setRemoteUid(uid);
            },
            onUserOffline: (_connection: RtcConnection, uid: number) => {
                // showMessage('Remote user ' + uid + ' left the channel');
                setRemoteUid(0);
            },
        };
        // Register the event handler
        agoraEngine.registerEventHandler(eventHandler.current);
        // Initialize the engine
        agoraEngine.initialize({
            appId: appId,
        });
        // Enable local video
        agoraEngine.enableVideo();
    } catch (e) {
        console.log(e);
    }
};
;

 


  const join = async () => {
    if (isJoined) {
        return;
    }
    try {
        if (isHost) {
            // Start preview
            agoraEngineRef.current?.startPreview();
            // Join the channel as a broadcaster
            agoraEngineRef.current?.joinChannel(token, channelName, uid, {
                // Set channel profile to live broadcast
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                // Set user role to broadcaster
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                // Publish audio collected by the microphone
                publishMicrophoneTrack: true,
                // Publish video collected by the camera
                publishCameraTrack: true,
                // Automatically subscribe to all audio streams
                autoSubscribeAudio: true,
                // Automatically subscribe to all video streams
                autoSubscribeVideo: true,
            });
        } else {
            // Join the channel as an audience
            agoraEngineRef.current?.joinChannel(token, channelName, uid, {
                // Set channel profile to live broadcast
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                // Set user role to audience
                clientRoleType: ClientRoleType.ClientRoleAudience,
                // Do not publish audio collected by the microphone
                publishMicrophoneTrack: false,
                // Do not publish video collected by the camera
                publishCameraTrack: false,
                // Automatically subscribe to all audio streams
                autoSubscribeAudio: true,
                // Automatically subscribe to all video streams
                autoSubscribeVideo: true,
            });
        }

        startRecording();
        setIsJoined(true);
    } catch (e) {
        console.log(e);
    }
};


  const leave = () => {
    console.log("Sid on meet end ",sid)
    
    console.log("Resource  on meet end ",resourceId)
    setRemoteUid(0)
    endMeeting();
    // stopRecording();
    setIsJoined(false);
    agoraEngineRef.current?.leaveChannel();
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

  const acquireResourceId = async (res:any) => {
    const recordingUID = 999999; // Replace with a unique integer user ID for the recording service
    // Replace with your Agora App ID
    const customerKey = '19a1e3a14f1a4c37be0cd382b5c8351a'; // Replace with your customer ID
    const customerSecret = '14af535508b943cabf8f56da50f93488'; // Replace with your customer secret
    const plainCredential = `${customerKey}:${customerSecret}`;
    const encodedCredential = Buffer.from(plainCredential).toString('base64');
    const authorizationField = `Basic ${encodedCredential}`;

    const body = {
      cname: res.channelName,
      uid: '9999',
      clientRequest: {
        resourceExpiredHour: 24,
        scene: 0,
      },
    };
    // Ensure channelName is defined
    // Replace with your channel name

    try {
      const response = await axios.post(
        `https://api.agora.io/v1/apps/${appId}/cloud_recording/acquire`,
        body,
        {
          headers: {
            Authorization: authorizationField,
            'Content-Type': 'application/json',
          },
        },
      );
      // console.log('Status code:', response.status);
      if (response.data) {
        // console.log("res data===>",response)
        const resourceId = response.data.resourceId; // Get the resource ID from the response
        // console.log('Acquired Resource ID:', resourceId);
        setResourceId(resourceId);
        return resourceId; // Save this resource ID for use in starting recording
      }
    } catch (error: any) {
      console.error(
        'Error acquiring resource ID:',
        error.response ? error.response.data : error.message,
      );
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
    // Replace with your Agora App ID
    const customerKey = '19a1e3a14f1a4c37be0cd382b5c8351a'; // Replace with your customer ID
    const customerSecret = '14af535508b943cabf8f56da50f93488'; // Replace with your customer secret
    const plainCredential = `${customerKey}:${customerSecret}`;
    const encodedCredential = Buffer.from(plainCredential).toString('base64');
    const authorizationField = `Basic ${encodedCredential}`;
    if (recordingStarted) return;
    // console.log("Start recording rs id ===>",resourceId)
    try {
      const response = await axios.post(
        `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/mode/${recordingMode}/start`,
        {
          cname: channelName,
          uid: '9999',
          clientRequest: {
            token: token,
            recordingConfig: {
              maxIdleTime: 120,
              streamType: 0,
              audioProfile: 1, // Adjust audio profile as needed
              recordingFileConfig: {
                avFileType: ['wav'],
              },
            },
            storageConfig: {
              vendor: 1,
              region: 1,
              bucket: 'agora-rn',
              accessKey: 'AKIA4MTWLSANRGY4EQUE',
              secretKey: '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',
            },
          },
        },
        {
          headers: {
            Authorization: authorizationField,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data) {
        // setResourceId(response.data.resourceId);
        setRecordingStarted(true);
        console.log('Recording started:', response.data);
        if (response.data) {
            const SID = response.data.sid
          console.log('Sid after meet  ===>',SID );
          setsid(SID);
          postData(response.data);
        }
      }
    } catch (error: any) {
      console.error(
        'Error starting recording:',
        error.response ? error.response.data : error.message,
      );
    }
  };

  const stopRecording = async () => {
    if (!recordingStarted) return;
    console.log('Stop recording ===>');
    try {
      const response = await axios.post(
        `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/stop`,
        {
          cname: channelName,
          uid: uid,
          clientRequest: {
            token: '',
          },
        },
      );

      console.log('Recording stopped:', response.data);
      setRecordingStarted(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const callbacks = {
    EndCall: () => {
       
        setVideoCall(false)
        endMeeting();
    },
};

  function showMessage(msg: string) {
    setMessage(msg);
};

  return (
    videoCall && channelName && token  ? (
        <AgoraUIKit connectionData={connectionData} rtcCallbacks={callbacks} />
    ) : (
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>

            <TouchableOpacity style={{padding:15,backgroundColor:"#6EC207",borderRadius:30}}>
            <Text style={{color:"#fff"}}  onPress={() => {
            setVideoCall(true);
            startRecording();
        }}>Start Call</Text>
            </TouchableOpacity>

            <View style={{marginTop:20,justifyContent:"center",alignItems:"center",padding:10}}>
            <Text style={{fontSize:14,fontWeight:700}}>Meet response will show here ...</Text>

            <Text>{
                loading ? "loading..." : msg
               }
            </Text>
            </View>
            
              
        </View>



       
    )
  );
};

const styles = StyleSheet.create({
    button: {
        padding:4,
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: '#0055cc',
        margin: 5,
        borderRadius:10,
    },
    main: { flex: 1, alignItems: 'center',marginTop:30 },
    scroll: { flex: 1, backgroundColor: '#fff', width: '100%' },
    scrollContainer: { alignItems: 'center' },
    videoView: { width: '90%', height: 200 },
    btnContainer: { flexDirection: 'row', justifyContent: 'center' },
    head: { fontSize: 20 },
    info: { backgroundColor: '#ffffe0', paddingHorizontal: 8, color: '#0000ff' },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap:'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f8f8', // Light background for contrast
        borderTopWidth: 1,
        borderTopColor: '#ddd',
      },
      joinButton: {
        backgroundColor: '#007BFF', // Blue color for join button
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 2, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
     
      endCallButton: {
        backgroundColor: '#dc3545', // Red color for end call button
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 2, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      buttonText: {
        color: '#fff', // White text color for buttons
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
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
